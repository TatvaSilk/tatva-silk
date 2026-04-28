export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))
  doc.on('end', () => {})

  /* ===== HEADER ===== */
  doc.fontSize(22).text('Tatva Silk', { align: 'center' })
  doc.fontSize(12).text('Invoice', { align: 'center' })
  doc.moveDown()

  /* ===== ORDER INFO ===== */
  doc.fontSize(10)
  doc.text(`Order No: ${data.order_no}`)
  doc.text(`Order Date: ${new Date(data.created_at).toLocaleDateString()}`)
  doc.text(`Status: ${data.status}`)
  doc.moveDown()

  /* ===== TABLE HEADER ===== */
  doc.fontSize(11)
  doc.text('Product', 50)
  doc.text('Qty', 300)
  doc.text('Price', 350)
  doc.text('Total', 430)
  doc.moveDown(0.5)

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown()

  /* ===== ITEMS ===== */
  let y = doc.y
  data.order_items.forEach((item: any) => {
    doc.text(item.name, 50, y, { width: 240 })
    doc.text(String(item.qty), 300, y)
    doc.text(`₹${item.price}`, 350, y)
    doc.text(`₹${item.price * item.qty}`, 430, y)
    y += 20
  })

  doc.moveDown(2)
  doc.fontSize(13).text(`Grand Total: ₹${data.grand_total}`, {
    align: 'right',
  })

  doc.moveDown(3)
  doc.fontSize(9).text(
    'Thank you for shopping with Tatva Silk.',
    { align: 'center' }
  )

  doc.end()

  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.order_no}.pdf"`,
    },
  })
}
