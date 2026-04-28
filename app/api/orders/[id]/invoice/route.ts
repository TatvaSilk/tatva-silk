import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id

  // 1️⃣ Fetch order + items
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      grand_total,
      status,
      order_items (
        name,
        price,
        qty
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) {
    return new NextResponse('Order not found', { status: 404 })
  }

  // 2️⃣ Create PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))
  doc.on('end', () => {})

  /* ===== HEADER ===== */
  doc
    .fontSize(20)
    .text('Tatva Silk', { align: 'center' })
    .fontSize(10)
    .text('Invoice', { align: 'center' })
    .moveDown()

  /* ===== ORDER INFO ===== */
  doc.fontSize(10)
  doc.text(`Order No: ${data.order_no}`)
  doc.text(`Order Date: ${new Date(data.created_at).toLocaleDateString()}`)
  doc.text(`Status: ${data.status}`)
  doc.moveDown()

  /* ===== TABLE HEADER ===== */
  doc.fontSize(11)
  doc.text('Product', 50, doc.y, { width: 250 })
  doc.text('Qty', 300, doc.y, { width: 50 })
  doc.text('Price', 350, doc.y, { width: 80 })
  doc.text('Total', 430, doc.y, { width: 80 })
  doc.moveDown(0.5)

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown()

  /* ===== ITEMS ===== */
  let y = doc.y

  data.order_items.forEach((item: any) => {
    doc.text(item.name, 50, y, { width: 250 })
    doc.text(String(item.qty), 300, y)
    doc.text(`₹${item.price}`, 350, y)
    doc.text(`₹${item.price * item.qty}`, 430, y)
    y += 20
  })

  doc.moveDown(2)

  /* ===== GRAND TOTAL ===== */
  doc.fontSize(13)
  doc.text(`Grand Total: ₹${data.grand_total}`, {
    align: 'right',
  })

  /* ===== FOOTER ===== */
  doc.moveDown(3)
  doc.fontSize(9)
  doc.text(
    'Thank you for shopping with Tatva Silk.',
    { align: 'center' }
  )

  doc.end()

  // 3️⃣ Return PDF
  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.order_no}.pdf"`,
    },
  })
}
``
