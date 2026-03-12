// app/api/pay/upi/route.ts
import { NextResponse } from 'next/server';
import * as QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const { amount, orderId, note } = await req.json();

    // Your merchant UPI VPA and name
    const pa = process.env.NEXT_PUBLIC_MERCHANT_VPA || 'tatvasilk@icici';
    const pn = encodeURIComponent('Tatva Silk');

    const am = Number(amount || 0).toFixed(2);
    const tn = encodeURIComponent(note || `Order ${orderId}`);
    const tr = encodeURIComponent(orderId || `TS${Date.now()}`);
    const cu = 'INR';

    // NPCI-compliant deep link
    const upiLink = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&tr=${tr}&cu=${cu}`;

    // SVG QR for the same link
    const svg = await QRCode.toString(upiLink, {
      type: 'svg',
      errorCorrectionLevel: 'M',
    });

    return NextResponse.json({ upiLink, qrSvg: svg }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build UPI link' }, { status: 400 });
  }
}
