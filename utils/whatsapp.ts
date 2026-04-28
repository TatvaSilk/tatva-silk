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
  if (!phone) {
    alert('Phone number not found')
    return
  }

  const cleanedPhone = phone.replace(/\D/g, '')

  const message = encodeURIComponent(
`Thank you for shopping with Tatva Silk 🙏

🧾 Invoice No: ${invoiceNo}
💰 Amount: ₹${amount}

Download your invoice:
https://tatva-silk.vercel.app/api/orders/${orderId}/invoice

— Tatva Silk & Shubh Vivah`
  )

  const url = `https://wa.me/91${cleanedPhone}?text=${message}`
  window.open(url, '_blank')
}
