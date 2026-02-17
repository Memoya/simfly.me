import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prisma } = await import('@/lib/prisma');
        const { createOrder } = await import('@/lib/esim');
        const { sendOrderConfirmation } = await import('@/lib/email');

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
            apiVersion: '2023-10-16' as any,
        });

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        const body = await request.text();
        const headersList = await headers();
        const sig = headersList.get('stripe-signature') as string;

        let event: Stripe.Event;

        try {
            if (!webhookSecret || webhookSecret === 'mock_secret') {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('[WEBHOOK] Using Mock Secret - Verify this is intended');
                    event = JSON.parse(body);
                } else {
                    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
                }
            } else {
                event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Webhook signature verification failed:', errorMessage);
            return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerEmail = session.customer_details?.email;
            const sessionId = session.id;

            console.log(`[WEBHOOK] Processing order for session: ${sessionId}`);

            try {
                const existingOrder = await prisma.order.findUnique({
                    where: { stripeSessionId: sessionId },
                });

                if (existingOrder) {
                    console.log(`[WEBHOOK] Order ${sessionId} already exists. Skipping.`);
                    return NextResponse.json({ received: true, status: 'already_processed' });
                }

                let items: any[] = [];
                if (session.metadata?.payment_intent_data) {
                    try {
                        const orderData = JSON.parse(session.metadata.payment_intent_data);
                        items = orderData.items || [];
                    } catch (e) {
                        console.error("Failed to parse payment_intent_data", e);
                    }
                } else {
                    console.warn("No item metadata found");
                }

                const newOrder = await prisma.order.create({
                    data: {
                        stripeSessionId: sessionId,
                        paymentIntentId: session.payment_intent as string | null,
                        amount: (session.amount_total || 0) / 100,
                        currency: session.currency || 'usd',
                        status: session.payment_status,
                        customerEmail: customerEmail,
                        items: {
                            create: items.map((item: any) => ({
                                productName: item.name || 'Unknown Bundle',
                                quantity: item.quantity || 1,
                                price: 0
                            }))
                        }
                    },
                    include: { items: true }
                });

                const providerSync = await prisma.providerSync.create({
                    data: {
                        orderId: newOrder.id,
                        stripePaymentIntentId: session.payment_intent as string | null,
                        syncStatus: 'PENDING'
                    }
                });

                const esimResults = [];
                let allSuccess = true;
                const emailIds: string[] = [];

                for (const item of newOrder.items) {
                    console.log(`[WEBHOOK] Creating eSIM order for: ${item.productName}`);
                    const result = await createOrder(item.productName);

                    if (result.success && result.iccid) {
                        console.log(`[WEBHOOK] eSIM Created. ID: ${result.iccid}`);

                        await prisma.orderItem.update({
                            where: { id: item.id },
                            data: {
                                iccid: result.iccid,
                                matchingId: result.matchingId,
                                esimGoOrderRef: result.matchingId
                            }
                        });

                        esimResults.push(result);

                        try {
                            const emailResult = await sendOrderConfirmation({
                                customerEmail: customerEmail || 'customer@example.com',
                                orderId: sessionId,
                                productName: item.productName,
                                qrCodeUrl: result.qrCodeUrl || '',
                                dataAmount: 'Standard Data',
                                duration: '30 Days'
                            });

                            if (emailResult.success && emailResult.id) {
                                console.log(`[WEBHOOK] Email sent. ID: ${emailResult.id}`);
                                emailIds.push(emailResult.id);
                            }
                        } catch (emailErr) {
                            console.error("Failed to send email", emailErr);
                        }

                    } else {
                        console.error('[WEBHOOK] Failed to create eSIM:', result.error);
                        allSuccess = false;
                    }
                }

                await prisma.providerSync.update({
                    where: { id: providerSync.id },
                    data: {
                        syncStatus: allSuccess ? 'COMPLETED' : 'PARTIAL_FAILURE',
                        esimGoOrderIds: JSON.stringify(esimResults.map(r => r.matchingId)),
                        resendMessageId: JSON.stringify(emailIds),
                        emailStatus: emailIds.length > 0 ? 'SENT' : 'FAILED'
                    }
                });

            } catch (error) {
                console.error('[WEBHOOK] Order processing failed:', error);
                return NextResponse.json({ error: 'Order processing failed' }, { status: 500 });
            }
        } else if (event.type === 'charge.refunded') {
            const charge = event.data.object as Stripe.Charge;
            const paymentIntentId = charge.payment_intent as string;

            console.log(`[WEBHOOK] Processing refund for payment intent: ${paymentIntentId}`);

            try {
                const order = await prisma.order.findFirst({
                    where: { paymentIntentId: paymentIntentId }
                });

                if (order) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'refunded' }
                    });
                    console.log(`[WEBHOOK] Order ${order.id} marked as refunded.`);
                } else {
                    console.warn(`[WEBHOOK] No order found for refund PI: ${paymentIntentId}`);
                }
            } catch (e) {
                console.error("Failed to process refund", e);
                return NextResponse.json({ error: 'Refund processing failed' }, { status: 500 });
            }
        }

        return NextResponse.json({ received: true });
    } catch (outerError) {
        console.error('[WEBHOOK] Critical error:', outerError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
