export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GST_RATE = 0.05

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      invoice_no,
      order_no,
      created_at,
      grand_total,
      customer_id,
      order_items ( name, price, qty )
    `)
    .eq('id', orderId)
    .single()

  if (!order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  /* Generate invoice number ONCE */
  let invoiceNo = order.invoice_no
  if (!invoiceNo) {
    invoiceNo = `TS-INV-${new Date().getFullYear()}-${order.id.slice(0,6).toUpperCase()}`
    await supabase
      .from('orders')
      .update({ invoice_no: invoiceNo, invoice_issued_at: new Date() })
      .eq('id', order.id)
  }

  const { data: customer } = await supabase
    .from('customer_profiles')
    .select('full_name, address_line1, city, state, pincode, phone')
    .eq('id', order.customer_id)
    .single()

  const subtotal = order.order_items.reduce(
    (s: number, i: any) => s + i.price * i.qty, 0
  )
  const gst = subtotal * GST_RATE

  const upiUrl =
    `upi://pay?pa=9638683720@upi&pn=Tatva%20Silk&am=${order.grand_total}&cu=INR`

  const rows = order.order_items.map(i => `
    <tr>
      <td>${i.name}<br/><small>${i.name}</small></td>
      <td>5407</td>
      <td>${i.qty}</td>
      <td>₹${i.price}</td>
      <td>₹${i.qty * i.price}</td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
body { font-family: Arial; padding:40px }
.header { display:flex; justify-content:space-between }
.logo { height:70px }
.box { border:1px solid #ddd; padding:12px; margin-top:12px }
table { width:100%; border-collapse:collapse; margin-top:14px }
th,td { border:1px solid #ccc; padding:8px }
th { background:#f4f4f4 }
.right { text-align:right }
.footer { margin-top:40px; font-size:11px; text-align:center }
</style>
</head>

<body>

<div class="header">
  <img src="${COMPANY.logoUrl}" class="logo"/>
  <div>
    <strong>Tax Invoice</strong><br/>
    Invoice No: ${invoiceNo}<br/>
    Date: ${new Date(order.created_at).toLocaleDateString()}
  </div>
</div>

<div class="box">
<strong>${COMPANY.nameEn}</strong><br/>
<strong>${COMPANY.nameGu}</strong><br/>
${COMPANY.addressEn.replace(/\n/g,'<br/>')}<br/>
${COMPANY.addressGu.replace(/\n/g,'<br/>')}<br/>
GSTIN: ${COMPANY.gstin}<br/>
Phone: ${COMPANY.phone} | Email: ${COMPANY.email}
</div>

<div class="box">
<strong>Ship To / મોકલવાનું સરનામું</strong><br/>
${customer?.full_name}<br/>
${customer?.address_line1}<br/>
${customer?.city}, ${customer?.state} – ${customer?.pincode}<br/>
Phone: ${customer?.phone}
</div>

<table>
<thead>
<tr>
<th>Product / વસ્તુ</th>
<th>HSN</th>
<th>Qty</th>
<th>Rate</th>
<th>Amount</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>

<p class="right">Subtotal: ₹${subtotal.toFixed(2)}</p>
<p class="right">CGST (2.5%): ₹${(gst/2).toFixed(2)}</p>
<p class="right">SGST (2.5%): ₹${(gst/2).toFixed(2)}</p>
<p class="right"><strong>Grand Total: ₹${order.grand_total}</strong></p>

<div class="box">
<strong>Pay via UPI / યુપીઆઈ દ્વારા ચુકવણી</strong><br/>
<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}"/>
</div>

<div class="box">
<strong>Terms & Conditions / શરતો</strong><br/>
• Goods once sold will not be taken back<br/>
• Exchange within 7 days with bill<br/>
• Subject to Navsari jurisdiction<br/>
• માલ વેચાયા પછી પરત લેવામાં આવતો નથી
</div>

<div class="footer">
This is a computer‑generated invoice / આ કમ્પ્યુટર જનરેટેડ બિલ છે
</div>

<script>window.onload=()=>window.print()</script>

</body>
</html>
`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
