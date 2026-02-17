import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

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

            if (localOrder && localOrder.items.length > 0) {
                const item = localOrder.items[0];
                productName = item.productName;

                if (item.matchingId) {
                    const smdp = 'rsp.esim-go.com';
                    qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=LPA:1$${smdp}$${item.matchingId}&chs=200x200`;
                } else {
                    qrCodeUrl = 'https://chart.googleapis.com/chart?cht=qr&chl=Processing-Error&chs=200x200';
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

                qrCodeUrl = (session.metadata?.qrCodeUrl as string) || 'https://chart.googleapis.com/chart?cht=qr&chl=eSIM-Ref-Not-Found&chs=200x200';
                dataAmount = (metadata.data as string) || 'Standard';
                duration = (metadata.duration as string) || '30 Days';
            }

            const sent = await sendOrderConfirmation({
                customerEmail: email,
                orderId: orderId,
                productName,
                qrCodeUrl,
                dataAmount,
                duration
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
