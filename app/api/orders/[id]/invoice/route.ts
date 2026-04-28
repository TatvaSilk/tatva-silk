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

  /* 1️⃣ Try lookup by ID */
  let { data: order, error } = await supabase
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
    `)
    .eq('id', orderRef)
    .single()

  /* 2️⃣ If not found, try order_no */
  if (!order) {
    const res = await supabase
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
      `)
      .eq('order_no', orderRef)
      .single()

    order = res.data
    error = res.error
  }

  if (error || !order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  /* 3️⃣ Load shipping address */
  const { data: customer } = await supabase
    .from('customer_profiles')
    .select(`
      full_name,
      phone,
      address_line1,
      city,
      state,
      pincode
    `)
    .eq('id', order.customer_id)
    .single()

  /* 4️⃣ Calculations */
  const subtotal = order.order_items.reduce(
    (s: number, i: any) => s + i.price * i.qty,
    0
  )

  const gst = subtotal * GST_RATE
  const cgst = gst / 2
  const sgst = gst / 2

  const invoiceNo = `TS-INV-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`

  /* 5️⃣ Items */
  const rows = order.order_items
    .map(
      (i: any) => `
        <tr>
          <td>${i.name}</td>
          <td>${i.qty}</td>
          <td>₹${i.price}</td>
          <td>₹${i.price * i.qty}</td>
        </tr>
      `
    )
    .join('')

  /* 6️⃣ HTML Invoice */
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice ${invoiceNo}</title>
<style>
body { font-family: Arial; padding: 40px }
table { width: 100%; border-collapse: collapse; margin-top: 20px }
th, td { border: 1px solid #ccc; padding: 10px }
th { background: #f4f4f4 }
.right { text-align: right }
</style>
</head>
<body>

<h1 style="text-align:center">Tatva Silk</h1>

<p>
<strong>Invoice:</strong> ${invoiceNo}<br/>
<strong>Order No:</strong> ${order.order_no}<br/>
<strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}
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
<tr>
  <th>Product</th>
  <th>Qty</th>
  <th>Price</th>
  <th>Total</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<p class="right">Subtotal: ₹${subtotal.toFixed(2)}</p>
<p class="right">CGST (2.5%): ₹${cgst.toFixed(2)}</p>
<p class="right">SGST (2.5%): ₹${sgst.toFixed(2)}</p>
<p class="right"><strong>Grand Total: ₹${order.grand_total}</strong></p>

<script>
  window.onload = () => window.print();
</script>

</body>
</html>
`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="invoice-${invoiceNo}.html"`,
    },
  })
}
