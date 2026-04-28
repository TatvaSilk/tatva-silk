export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
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

  const rows = data.order_items
    .map(
      item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>₹${item.price}</td>
          <td>₹${item.price * item.qty}</td>
        </tr>
      `
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${data.order_no}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #111;
    }
    h1 {
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f4f4f4;
    }
    .total {
      text-align: right;
      font-size: 18px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>Tatva Silk</h1>
  <p><strong>Invoice:</strong> ${data.order_no}</p>
  <p><strong>Date:</strong> ${new Date(data.created_at).toLocaleDateString()}</p>
  <p><strong>Status:</strong> ${data.status}</p>

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

  <div class="total">
    <strong>Grand Total: ₹${data.grand_total}</strong>
  </div>

  <div class="footer">
    Thank you for shopping with Tatva Silk.
  </div>

  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>
`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="invoice-${data.order_no}.html"`,
    },
  })
}
``
