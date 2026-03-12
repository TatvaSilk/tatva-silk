import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, orderId, note } = await req.json();

    // Your merchant UPI VPA + display name
    const pa = process.env.NEXT_PUBLIC_MERCHANT_VPA || 'tatvasilk@icici';
    const pn = encodeURIComponent('Tatva Silk');

    const am = Number(amount || 0).toFixed(2);
    const tn = encodeURIComponent(note || `Order ${orderId}`);
    const tr = encodeURIComponent(orderId || `TS${Date.now()}`);
    const cu = 'INR';

    // NPCI-compliant UPI deep link
    const upiLink = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&tr=${tr}&cu=${cu}`;

    let qrSvg: string | null = null;

    // Try dynamic import so build doesn't fail if 'qrcode' isn't present
    try {
      const QRCode = await import('qrcode'); // ESM default export
      qrSvg = await QRCode.default.toString(upiLink, {
        type: 'svg',
        errorCorrectionLevel: 'M',
      });
    } catch {
      // If the module is missing at build/runtime, we just return null here.
      qrSvg = null;
    }

    return NextResponse.json({ upiLink, qrSvg }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to build UPI link' },
      { status: 400 }
    );
  }
}
