export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* =================== SUPABASE =================== */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* =================== CONSTANTS =================== */

const GST_RATE = 0.05

const COMPANY = {
  nameEn: 'Tatva Silk & Shubh Vivah',
  nameGu: 'તત્વા સિલ્ક અને શુભ વિવાહ',
  gstin: '24ABCDE1234F1Z5', // replace when final GSTIN available
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

/* =================== ROUTE =================== */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id

  /* ----- ORDER ----- */
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      invoice_no,
      created_at,
      grand_total,
      customer_id,
      order_items (
        name,
        price,
        qty
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  /* ----- INVOICE NUMBER (ONCE) ----- */
  let invoiceNo = order.invoice_no
  if (!invoiceNo) {
    invoiceNo = `TS-INV-${new Date().getFullYear()}-${order.id
      .slice(0, 6)
      .toUpperCase()}`

    await supabase
      .from('orders')
      .update({
        invoice_no: invoiceNo,
        invoice_issued_at: new Date(),
      })
      .eq('id', order.id)
  }

  /* ----- CUSTOMER ----- */
  const { data: customer } = await supabase
    .from('customer_profiles')
    .select(
      'full_name, address_line1, city, state, pincode, phone'
    )
    .eq('id', order.customer_id)
    .single()

  /* ----- TOTALS ----- */
  const subtotal = order.order_items.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0
  )

  const gst = subtotal * GST_RATE

  /* ----- UPI QR ----- */
  const upiUrl = `upi://pay?pa=${COMPANY.upiId}&pn=${encodeURIComponent(
    COMPANY.nameEn
  )}&am=${order.grand_total}&cu=INR`

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    upiUrl
  )}`

  /* ----- ITEMS ----- */
  const rows = order.order_items
    .map(
      i => `
      <tr>
        <td>${i.name}<br/><small>${i.name}</small></td>
        <td>5407</td>
        <td>${i.qty}</td>
        <td>₹${i.price}</td>
        <td>₹${i.qty * i.price}</td>
      </tr>
    `
    )
    .join('')

  /* =================== HTML =================== */

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice</title>
<style>
body { font-family: Arial, sans-serif; padding:40px; color:#111 }
.header { display:flex; justify-content:space-between; align-items:center }
.logo { height:70px; object-fit:contain }
.box { border:1px solid #ddd; padding:12px; margin-top:12px; font-size:13px }
table { width:100%; border-collapse:collapse; margin-top:16px; font-size:13px }
th,td { border:1px solid #ccc; padding:8px }
th { background:#f4f4f4 }
.right { text-align:right }
.total { font-size:15px; font-weight:bold }
.footer { margin-top:40px; font-size:11px; text-align:center; color:#555 }
</style>
</head>

<body>

<!-- HEADER -->
<div class="header">
  <img src="${COMPANY.logoUrl}" class="logo" />
  <div>
    <strong>TAX INVOICE</strong><br/>
    Invoice No: ${invoiceNo}<br/>
    Order No: ${order.order_no}<br/>
    Date: ${new Date(order.created_at).toLocaleDateString()}
  </div>
</div>

<!-- SELLER -->
<div class="box">
  <strong>${COMPANY.nameEn}</strong><br/>
  <strong>${COMPANY.nameGu}</strong><br/>
  ${COMPANY.addressEn.replace(/\n/g, '<br/>')}<br/>
  ${COMPANY.addressGu.replace(/\n/g, '<br/>')}<br/>
  GSTIN: ${COMPANY.gstin}<br/>
  Phone: ${COMPANY.phone} | Email: ${COMPANY.email}
</div>

<!-- BUYER -->
<div class="box">
  <strong>Ship To / મોકલવાનું સરનામું</strong><br/>
  ${customer?.full_name || ''}<br/>
  ${customer?.address_line1 || ''}<br/>
  ${customer?.city || ''}, ${customer?.state || ''} - ${customer?.pincode || ''}<br/>
  Phone: ${customer?.phone || ''}
</div>

<!-- ITEMS -->
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
<tbody>
${rows}
</tbody>
</table>

<p class="right">Subtotal: ₹${subtotal.toFixed(2)}</p>
<p class="right">CGST (2.5%): ₹${(gst / 2).toFixed(2)}</p>
<p class="right">SGST (2.5%): ₹${(gst / 2).toFixed(2)}</p>
<p class="right total">Grand Total: ₹${order.grand_total}</p>

<!-- UPI -->
<div class="box">
  <strong>Pay via UPI / યુપીઆઈ દ્વારા ચુકવણી</strong><br/>
  <img src="${qrUrl}" alt="UPI QR"/><br/>
  ${COMPANY.upiId}
</div>

<!-- TERMS -->
<div class="box">
  <strong>Terms & Conditions / શરતો</strong><br/>
  • Goods once sold will not be taken back<br/>
  • Exchange within 7 days with bill<br/>
  • Subject to Navsari jurisdiction<br/>
  • માલ વેચાયા પછી પરત લેવામાં આવતો નથી
</div>

<div class="footer">
  This is a computer-generated invoice / આ કમ્પ્યુટર જનરેટેડ બિલ છે
</div>

<script>
  window.onload = () => window.print()
</script>

</body>
</html>
`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
