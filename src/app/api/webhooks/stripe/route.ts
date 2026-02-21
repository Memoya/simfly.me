import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/providers';
import { fulfillProduct } from '@/lib/fulfillment';
import { sendOrderConfirmation, sendAdminAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log('[STRIPE-WEBHOOK] Webhook POST received');

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2023-10-16' as any,
        });

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const body = await request.text();
        const headersList = await headers();
        const sig = headersList.get('stripe-signature') as string;

        let event: Stripe.Event;

        try {
            if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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
                                productName: item.sku || item.name || 'eSIM Bundle',
                                quantity: item.quantity || 1,
                                price: item.price || 0,
                                costPrice: item.costPrice || 0,
                                providerId: item.providerId || undefined
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
                        const bundleId = item.productName;
                        const providerId = (item as any).providerId || undefined;

                        console.log(`[STRIPE-WEBHOOK] Fulfilling ${bundleId}` + (providerId ? ` via ${providerId}` : ' (auto-select provider)'));

                        // Use the new fulfillment engine with failover support and auto-provider-selection
                        const result = await fulfillProduct(bundleId, providerId);

                        if (result.success && result.esim) {
                            console.log(`[STRIPE-WEBHOOK] eSIM SUCCESS: ${result.esim.iccid} via ${result.finalProviderId}`);

                            await prisma.orderItem.update({
                                where: { id: item.id },
                                data: {
                                    iccid: result.esim.iccid,
                                    matchingId: result.esim.matchingId,
                                    smdpAddress: result.esim.smdpAddress,
                                    providerId: result.finalProviderId // Update in case of failover
                                }
                            });

                            const legacyResult = {
                                success: true,
                                iccid: result.esim.iccid,
                                matchingId: result.esim.matchingId,
                                smdpAddress: result.esim.smdpAddress,
                                qrCodeUrl: result.esim.qrCodeUrl
                            };

                            esimResults.push(legacyResult);

                            console.log(`[STRIPE-WEBHOOK] Sending email to ${customerEmail}`);
                            const productDetails = await prisma.product.findUnique({
                                where: { id: bundleId }
                            });

                            let displayName = item.productName;
                            if (productDetails) {
                                const regionName = productDetails.countries && (productDetails.countries as any[])[0]?.name
                                    ? (productDetails.countries as any[])[0].name
                                    : productDetails.name;

                                displayName = `${regionName} ${productDetails.dataAmount ? (productDetails.dataAmount < 1000 ? productDetails.dataAmount + 'MB' : productDetails.dataAmount / 1000 + 'GB') : ''}`;
                            }

                            const originalMetaItem = items.find((i: any) => (i.sku === bundleId) || (i.name === bundleId));
                            if (originalMetaItem && originalMetaItem.name && originalMetaItem.name !== bundleId) {
                                displayName = originalMetaItem.name;
                            }

                            const durationString = productDetails?.duration
                                ? `${productDetails.duration} Tage`
                                : '30 Tage';

                            const dataAmountString = (() => {
                                if (!productDetails) return 'Standard Data';

                                if (productDetails.dataAmount === -1) {
                                    let tier = 'Lite';
                                    let speed = '1GB HighSpeed';

                                    if (productDetails.name.includes('_ULP_')) {
                                        tier = 'Plus';
                                        speed = '2GB HighSpeed';
                                    } else if (productDetails.name.includes('_ULE_')) {
                                        tier = 'Essential';
                                        speed = '1GB HighSpeed';
                                    }

                                    return `Unlimited ${tier} (${speed})`;
                                }

                                if (productDetails.dataAmount && productDetails.dataAmount >= 1000) {
                                    return `${productDetails.dataAmount / 1000} GB`;
                                }

                                return `${productDetails.dataAmount || 0} MB`;
                            })();

                            const emailResult = await sendOrderConfirmation({
                                customerEmail: customerEmail || 'customer@example.com',
                                orderId: sessionId,
                                productName: displayName,
                                qrCodeUrl: legacyResult.qrCodeUrl || '',
                                dataAmount: dataAmountString,
                                duration: durationString,
                                iccid: legacyResult.iccid,
                                matchingId: legacyResult.matchingId,
                                smdpAddress: legacyResult.smdpAddress
                            });

                            if (emailResult.success) {
                                console.log(`[STRIPE-WEBHOOK] Email OK. ID: ${emailResult.id}`);
                                if (emailResult.id) emailIds.push(emailResult.id);
                            } else {
                                console.error(`[STRIPE-WEBHOOK] Email FAILED: ${emailResult.error}`);
                                await sendAdminAlert('Email Sending Failed', `Order ${sessionId} paid but email failed for ${customerEmail}. Error: ${emailResult.error}`);
                            }
                        } else {
                            console.error(`[STRIPE-WEBHOOK] Fulfillment FAILED: ${result.error}`);
                            await sendAdminAlert('eSIM Order Failed', `Order ${sessionId} paid but eSIM fulfillment failed for SKU ${bundleId}. Error: ${result.error}. Customer: ${customerEmail}`);
                            allSuccess = false;
                            
                            // Send email to customer even when fulfillment fails
                            console.log(`[STRIPE-WEBHOOK] Sending failure notification email to ${customerEmail}`);
                            try {
                                const { sendFailureNotification } = await import('@/lib/email-failure');
                                await sendFailureNotification({
                                    customerEmail: customerEmail || 'customer@example.com',
                                    orderId: sessionId,
                                    productName: item.productName,
                                    error: result.error
                                });
                            } catch (emailErr) {
                                console.error(`[STRIPE-WEBHOOK] Failure email error: ${emailErr}`);
                            }
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
