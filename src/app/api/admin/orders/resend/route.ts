import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        // Dynamic import
        const { prisma } = await import('@/lib/prisma');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' as any });

        try {
            const { orderId, email } = await request.json();

            if (!orderId || !email) {
                return NextResponse.json({ error: 'Missing orderId or email' }, { status: 400 });
            }

            // 1. Try to find local order first
            const localOrder = await prisma.order.findUnique({
                where: { stripeSessionId: orderId },
                include: { items: true }
            });

            let qrCodeUrl = '';
            let productName = 'eSIM Bundle';
            let dataAmount = 'Standard';
            let duration = '30 Days';
            let iccid: string | undefined = undefined;
            let smdpAddress: string | undefined = undefined;
            let matchingId: string | undefined = undefined;

            if (localOrder && localOrder.items.length > 0) {
                const item = localOrder.items[0];
                productName = item.productName;
                iccid = item.iccid || undefined;
                matchingId = item.matchingId || undefined;
                smdpAddress = item.smdpAddress || undefined;

                if (item.matchingId && smdpAddress) {
                    // Generate local QR Code
                    const qrData = `LPA:1$${smdpAddress}$${item.matchingId}`;
                    qrCodeUrl = await QRCode.toDataURL(qrData);
                } else {
                    // Fallback or error QR
                    qrCodeUrl = await QRCode.toDataURL('Error: No Matching ID found');
                }
            } else {
                const session = await stripe.checkout.sessions.retrieve(orderId, {
                    expand: ['line_items.data.price.product']
                });

                if (!session) {
                    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
                }

                const lineItems = session.line_items?.data || [];
                const firstItem = lineItems[0];
                productName = firstItem?.description || 'eSIM Bundle';
                const product = firstItem?.price?.product as Stripe.Product;
                const metadata = product?.metadata || {};

                // Generate QR Code from metadata if available, or generate error QR
                if (session.metadata?.qrCodeUrl) {
                    // If stored as URL, just use it? No, better to generate fresh if we have data.
                    // But here we might not have the raw data strings.
                    // Actually, simulation mode might have stored a URL.
                    // Let's just use what's there if it's a data URI, otherwise try to generate?
                    // The previous code used session.metadata.qrCodeUrl directly.
                    qrCodeUrl = session.metadata.qrCodeUrl;
                } else {
                    qrCodeUrl = await QRCode.toDataURL('Error: eSIM Ref Not Found');
                }

                dataAmount = (metadata.data as string) || 'Standard';
                duration = (metadata.duration as string) || '30 Days';
            }

            const sent = await sendOrderConfirmation({
                customerEmail: email,
                orderId: orderId,
                productName,
                qrCodeUrl,
                dataAmount,
                duration,
                iccid,
                matchingId,
                smdpAddress
            });

            if (sent.success) {
                if (localOrder) {
                    await prisma.providerSync.upsert({
                        where: { orderId: localOrder.id },
                        update: { resendMessageId: sent.id, emailStatus: 'SENT_MANUAL' },
                        create: { orderId: localOrder.id, syncStatus: 'PARTIAL', resendMessageId: sent.id, emailStatus: 'SENT_MANUAL' }
                    });
                }
                return NextResponse.json({ success: true, id: sent.id });
            } else {
                return NextResponse.json({ error: sent.error }, { status: 500 });
            }

        } catch (error) {
            console.error('Resend failed:', error);
            return NextResponse.json({ error: 'Failed to resend' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in resend route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
