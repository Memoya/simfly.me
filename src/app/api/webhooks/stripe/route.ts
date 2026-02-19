import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/esim';
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
                                productName: item.sku || item.name || 'eSIM Bundle', // Use SKU (esim_...) as the primary key/name in DB
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
                        // Use the SKU for fulfillment
                        const bundleId = item.productName; // This is now the SKU (esim_...)
                        console.log(`[STRIPE-WEBHOOK] Fulfilling SKU: ${bundleId}`);
                        const result = await createOrder(bundleId);

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
                            const productDetails = await prisma.product.findUnique({
                                where: { id: bundleId }
                            });

                            // Fallback display name logic (reconstruct region + data from SKU or use DB)
                            // e.g. "Turkey 1GB"
                            let displayName = item.productName; // Default
                            if (productDetails) {
                                // Try to make it friendly: "Turkey 1GB"
                                const regionName = productDetails.countries && (productDetails.countries as any[])[0]?.name
                                    ? (productDetails.countries as any[])[0].name
                                    : productDetails.name;

                                // Or use description if formatted
                                displayName = `${regionName} ${productDetails.dataAmount ? (productDetails.dataAmount < 1000 ? productDetails.dataAmount + 'MB' : productDetails.dataAmount / 1000 + 'GB') : ''}`;
                            }

                            // Override display name if metadata had original name (passed as 'name' prop in Payment Intent)
                            // But here item is from DB OrderItem. We lost the metadata 'name' unless we re-read from session metadata?
                            // Let's check session metadata again.
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
                                    // Unlimited Logic
                                    let tier = 'Lite';
                                    let speed = '1GB HighSpeed';

                                    if (productDetails.name.includes('_ULP_')) {
                                        tier = 'Plus';
                                        speed = '2GB HighSpeed';
                                    } else if (productDetails.name.includes('_ULE_')) {
                                        tier = 'Essential';
                                        speed = '1GB HighSpeed'; // ??? Logic says 1GB? Let's check catalogue.ts: Essential is 1GB too?
                                        // Catalogue ts says: Essential -> 1GB, 1.25Mbps
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
                                productName: displayName, // Friendly Name for email
                                qrCodeUrl: result.qrCodeUrl || '',
                                dataAmount: dataAmountString,
                                duration: durationString,
                                iccid: result.iccid,
                                matchingId: result.matchingId,
                                smdpAddress: result.smdpAddress
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
