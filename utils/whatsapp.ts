export function sendInvoiceOnWhatsApp({
  phone,
  orderId,
  invoiceNo,
  amount,
}: {
  phone: string
  orderId: string
  invoiceNo: string
  amount: number
}) {
  if (!phone) return

  const cleanPhone = phone.replace(/\D/g, '')

  const message = encodeURIComponent(
`Thank you for shopping with Tatva Silk 🙏

🧾 Invoice No: ${invoiceNo}
💰 Amount: ₹${amount}

Download your invoice:
https://tatva-silk.vercel.app/api/orders/${orderId}/invoice

— Tatva Silk & Shubh Vivah`
  )

  window.open(`https://wa.me/91${cleanPhone}?text=${message}`, '_blank')
}
