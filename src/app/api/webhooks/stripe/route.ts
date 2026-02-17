import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/esim';
import { sendOrderConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log('[STRIPE-WEBHOOK] Webhook POST received');

    try {
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
                    console.log('[STRIPE-WEBHOOK] Using Mock Secret');
                    event = JSON.parse(body);
                } else {
                    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
                }
            } else {
                event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`[STRIPE-WEBHOOK] Signature verification failed: ${errorMessage}`);
            return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
        }

        console.log(`[STRIPE-WEBHOOK] Event type: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerEmail = session.customer_details?.email;
            const sessionId = session.id;

            console.log(`[STRIPE-WEBHOOK] Session ID: ${sessionId}`);

            try {
                const existingOrder = await prisma.order.findUnique({
                    where: { stripeSessionId: sessionId },
                });

                if (existingOrder) {
                    console.log(`[STRIPE-WEBHOOK] Order ${sessionId} existed. Skipping.`);
                    return NextResponse.json({ received: true, status: 'already_processed' });
                }

                let items: any[] = [];
                if (session.metadata?.payment_intent_data) {
                    try {
                        const orderData = JSON.parse(session.metadata.payment_intent_data);
                        items = orderData.items || [];
                        console.log(`[STRIPE-WEBHOOK] Found ${items.length} items in metadata`);
                    } catch (e) {
                        console.error(`[STRIPE-WEBHOOK] Metadata parse error: ${e}`);
                    }
                }

                if (items.length === 0) {
                    console.log(`[STRIPE-WEBHOOK] No items in metadata. Fetching from Stripe...`);
                    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
                    items = lineItems.data.map(li => ({
                        name: li.description || 'eSIM Bundle',
                        quantity: li.quantity || 1,
                        price: (li.amount_total || 0) / 100
                    }));
                }

                console.log(`[STRIPE-WEBHOOK] Creating DB records...`);
                const newOrder = await prisma.order.create({
                    data: {
                        stripeSessionId: sessionId,
                        paymentIntentId: session.payment_intent as string | null,
                        amount: (session.amount_total || 0) / 100,
                        currency: session.currency || 'eur',
                        status: session.payment_status,
                        customerEmail: customerEmail,
                        items: {
                            create: items.map((item: any) => ({
                                productName: item.name || 'eSIM Bundle',
                                quantity: item.quantity || 1,
                                price: item.price || 0
                            }))
                        }
                    },
                    include: { items: true }
                });
                console.log(`[STRIPE-WEBHOOK] DB Order Created: ${newOrder.id}`);

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
                    try {
                        console.log(`[STRIPE-WEBHOOK] Fulfilling: ${item.productName}`);
                        const result = await createOrder(item.productName);

                        if (result.success && result.iccid) {
                            console.log(`[STRIPE-WEBHOOK] eSIM SUCCESS: ${result.iccid}`);

                            await prisma.orderItem.update({
                                where: { id: item.id },
                                data: {
                                    iccid: result.iccid,
                                    matchingId: result.matchingId,
                                    smdpAddress: result.smdpAddress,
                                    esimGoOrderRef: result.matchingId,
                                }
                            });

                            esimResults.push(result);

                            console.log(`[STRIPE-WEBHOOK] Sending email to ${customerEmail}`);
                            const emailResult = await sendOrderConfirmation({
                                customerEmail: customerEmail || 'customer@example.com',
                                orderId: sessionId,
                                productName: item.productName,
                                qrCodeUrl: result.qrCodeUrl || '',
                                dataAmount: 'Standard Data',
                                duration: '30 Days',
                                iccid: result.iccid,
                                matchingId: result.matchingId,
                                smdpAddress: result.smdpAddress
                            });

                            if (emailResult.success) {
                                console.log(`[STRIPE-WEBHOOK] Email OK. ID: ${emailResult.id}`);
                                if (emailResult.id) emailIds.push(emailResult.id);
                            } else {
                                console.error(`[STRIPE-WEBHOOK] Email FAILED: ${emailResult.error}`);
                            }
                        } else {
                            console.error(`[STRIPE-WEBHOOK] Fulfillment FAILED: ${result.error}`);
                            allSuccess = false;
                        }
                    } catch (itemErr) {
                        console.error(`[STRIPE-WEBHOOK] Loop error: ${itemErr}`);
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

                console.log(`[STRIPE-WEBHOOK] DONE processing session ${sessionId}`);

            } catch (error) {
                console.error(`[STRIPE-WEBHOOK] DB Error: ${error}`);
                return NextResponse.json({ error: 'Database processing failed' }, { status: 500 });
            }
        }

        return NextResponse.json({ received: true });
    } catch (outerError) {
        console.error('[STRIPE-WEBHOOK] CRITICAL:', outerError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
