export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GST_RATE = 0.05

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const orderRef = params.id

  /* 1️⃣ Load order (support id OR order_no) */
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      grand_total,
      status,
      customer_id,
      order_items (
        name,
        price,
        qty
      )
    )
    .or(`id.eq.${orderRef},order_no.eq.${orderRef}`)
    .single()

  if (error || !order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  /* 2️⃣ Load shipping address */
  const { data: customer } = await supabase
    .from('customer_profiles')
    .select(`
      full_name,
      phone,
      address_line1,
      city,
      state,
      pincode,
      email
    `)
    .eq('id', order.customer_id)
    .single()

  /* 3️⃣ Calculations */
  const subtotal = order.order_items.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0
  )

  const gst = subtotal * GST_RATE
  const cgst = gst / 2
  const sgst = gst / 2

  const invoiceNo = `TS-INV-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`

  /* 4️⃣ Render rows */
  const rows = order.order_items
    .map(
      (item: any) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>₹${item.price}</td>
        <td>₹${item.price * item.qty}</td>
      </tr>
    `
    )
    .join('')

  /* 5️⃣ HTML */
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${invoiceNo}</title>
  <style>
    body { font-family: Arial; padding: 40px; }
    h1 { text-align: center; }
    table { width:100%; border-collapse:collapse; margin-top:20px; }
    th,td { border:1px solid #ddd; padding:10px }
    th { background:#f3f3f3 }
    .right { text-align:right }
  </style>
</head>
<body>

<h1>Tatva Silk</h1>

<p>
<strong>Invoice:</strong> ${invoiceNo}<br/>
<strong>Order No:</strong> ${order.order_no}<br/>
<strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br/>
<strong>Status:</strong> ${order.status}
</p>

<h3>Shipping Address</h3>
<p>
${customer?.full_name || ''}<br/>
${customer?.address_line1 || ''}<br/>
${customer?.city || ''}, ${customer?.state || ''} - ${customer?.pincode || ''}<br/>
Phone: ${customer?.phone || ''}
</p>

<table>
<thead>
<tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<p class="right">Subtotal: ₹${subtotal.toFixed(2)}</p>
<p class="right">CGST (2.5%): ₹${cgst.toFixed(2)}</p>
<p class="right">SGST (2.5%): ₹${sgst.toFixed(2)}</p>
<p class="right"><strong>Grand Total: ₹${order.grand_total}</strong></p>

<p style="margin-top:40px;text-align:center;font-size:12px">
Thank you for shopping with Tatva Silk.
</p>

<script>
  window.onload = () => window.print();
</script>

</body>
</html>
`

  /* 6️⃣ OPTIONAL: Auto‑email (HTML ready) */
  // You can send `html` via your existing mail system or Supabase Edge Function.

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': \`inline; filename="invoice-\${invoiceNo}.html"\`,
    },
  })
}
