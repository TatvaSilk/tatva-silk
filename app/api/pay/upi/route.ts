// app/api/pay/upi/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, orderId, note } = await req.json();

    // Your merchant VPA + display name (set Vercel env: NEXT_PUBLIC_MERCHANT_VPA)
    const pa = process.env.NEXT_PUBLIC_MERCHANT_VPA || 'tatvasilk@icici';
    const pn = encodeURIComponent('Tatva Silk');

    const am = Number(amount || 0).toFixed(2);
    const tn = encodeURIComponent(note || `Order ${orderId}`);
    const tr = encodeURIComponent(orderId || `TS${Date.now()}`);
    const cu = 'INR';

    // NPCI-compliant deep link
    // upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&tr=<ref>&cu=INR
    const upiLink = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&tr=${tr}&cu=${cu}`;

    // Prebuilt QR image URL (no server package)
    // You can swap this to any QR image service later or self-host a tiny QR endpoint.
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      upiLink
    )}`;

    return NextResponse.json({ upiLink, qrImgUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build UPI link' }, { status: 400 });
  }
}
