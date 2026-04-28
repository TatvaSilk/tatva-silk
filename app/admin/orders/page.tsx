export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ================= SUPABASE ================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ================= CONSTANTS ================= */

const GST_RATE = 0.05

const COMPANY = {
  nameEn: 'Tatva Silk & Shubh Vivah',
  nameGu: 'તત્વા સિલ્ક અને શુભ વિવાહ',
  gstin: '24ABCDE1234F1Z5',
  phone: '9638683720',
  email: 'nimeshpatel001@yahoo.com',
  upiId: '9638683720@upi',
  logoUrl:
    'https://jebxuzazodxbzmwietls.supabase.co/storage/v1/object/public/logo/Designer%20(5).png',
  addressEn: `D-07/C, Ground Floor, Laxmi Palace
Shop No. 7, Old Laxmi Talkies
Station Road, Tatanagar Society
Bilimora, Ta-Gandevi
Dist. Navsari, Gujarat – 396321
India`,
  addressGu: `ડી-૦૭/સી, ગ્રાઉન્ડ ફ્લોર, લક્ષ્મી પેલેસ
શોપ નં. ૭, જુનું લક્ષ્મી ટોકીઝ
સ્ટેશન રોડ, તાતાનગર સોસાયટી
બિલીમોરા, તા-ગણદેવી
નવસારી, ગુજરાત – ૩૯૬૩૨૧`,
}

/* ================= ROUTE ================= */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ref = params.id

  /* ---------- 1️⃣ FETCH ORDER ONLY ---------- */
  let { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      invoice_no,
      created_at,
      grand_total,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_pin
    `)
    .eq('id', ref)
    .maybeSingle()

  if (!order) {
    const r = await supabase
      .from('orders')
      .select(`
        id,
        order_no,
        invoice_no,
        created_at,
        grand_total,
        shipping_name,
        shipping_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_pin
      `)
      .eq('order_no', ref)
      .maybeSingle()
    order = r.data
  }

  if (!order) {
    return new NextResponse(
      `Order not found for reference: ${ref}`,
      { status: 404 }
    )
  }

  /* ---------- 2️⃣ FETCH ORDER ITEMS ---------- */
  const { data: items } = await supabase
    .from('order_items')
    .select('name, price, qty')
    .eq('order_id', order.id)

  /* ---------- 3️⃣ INVOICE NUMBER ---------- */
  let invoiceNo = order.invoice_no
  if (!invoiceNo) {
    invoiceNo = `TS-INV-${new Date().getFullYear()}-${String(order.id).slice(0,6).toUpperCase()}`
    await supabase
      .from('orders')
      .update({
        invoice_no: invoiceNo,
        invoice_issued_at: new Date(),
      })
      .eq('id', order.id)
  }

  /* ---------- TOTALS ---------- */
  const subtotal =
    items?.reduce((s, i) => s + i.price * i.qty, 0) ?? 0
  const gst = subtotal * GST_RATE

  /* ---------- ROWS ---------- */
  const rows =
    items
      ?.map(
        i => `
<tr>
  <td>${i.name}</td>
  <td>5407</td>
  <td>${i.qty}</td>
  <td>₹${i.price}</td>
  <td>₹${i.qty * i.price}</td>
</tr>`
      )
      .join('') ?? ''

  /* ---------- ADDRESS ---------- */
  const fullAddress = `
${order.shipping_address_line1 || ''}
${order.shipping_address_line2 || ''}
${order.shipping_city || ''}, ${order.shipping_state || ''}
- ${order.shipping_pin || ''}
  `.trim().replace(/\n/g, '<br/>')

  /* ---------- HTML ---------- */
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
body { font-family: Arial; padding:40px }
.header { display:flex; justify-content:space-between; align-items:center }
.logo { height:70px }
.box { border:1px solid #ddd; padding:12px; margin-top:12px }
table { width:100%; border-collapse:collapse; margin-top:16px }
th,td { border:1px solid #ccc; padding:8px }
th { background:#f4f4f4 }
.right { text-align:right }
.total { font-weight:bold }
</style>
</head>
<body>

<div class="header">
  <img src="${COMPANY.logoUrl}" class="logo"/>
  <div>
    <strong>TAX INVOICE</strong><br/>
    Invoice No: ${invoiceNo}<br/>
    Order No: ${order.order_no}<br/>
    Date: ${new Date(order.created_at).toLocaleDateString()}
  </div>
</div>

<div class="box">
<strong>${COMPANY.nameEn}</strong><br/>
<strong>${COMPANY.nameGu}</strong><br/>
${COMPANY.addressEn.replace(/\n/g,'<br/>')}<br/>
${COMPANY.addressGu.replace(/\n/g,'<br/>')}<br/>
Phone: ${COMPANY.phone} | ${COMPANY.email}
</div>

<div class="box">
<strong>Ship To</strong><br/>
${order.shipping_name}<br/>
${fullAddress}<br/>
Phone: ${order.shipping_phone}
</div>

<table>
<thead>
<tr>
<th>Product</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amount</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>

<p class="right">Subtotal: ₹${subtotal.toFixed(2)}</p>
<p class="right">CGST (2.5%): ₹${(gst/2).toFixed(2)}</p>
<p class="right">SGST (2.5%): ₹${(gst/2).toFixed(2)}</p>
<p class="right total">Grand Total: ₹${order.grand_total}</p>

<script>window.print()</script>
</body>
</html>
`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
