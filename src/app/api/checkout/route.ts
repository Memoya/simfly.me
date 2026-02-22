
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Bundle } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { getSettings, applyMargin } = await import('@/lib/settings');
        const { getCatalogue } = await import('@/lib/catalogue');

        // Initialize Stripe inside the handler to ensure fresh config/version
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2023-10-16' as any,
        });

        const settings = await getSettings();

        const body = await request.json();
        const items = body.items || [];

        let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        const { discountCode } = body;
        let discount = undefined;
        if (discountCode) {
            discount = settings.discountCodes.find((d: any) => d.code === discountCode && d.active);
        }

        if (items.length > 0) {
            const catalogue = await getCatalogue();

            // 1. Calculate raw subtotal first
            let subtotal = 0;
            const prepared = items.map((item: any) => {
                let basePrice: number;
                const bundle = item.id ? catalogue.find((b: Bundle) => b.name === item.id) : undefined;
                if (bundle) {
                    // Pass item.id (SKU) so price overrides are applied
                    basePrice = applyMargin(bundle.price, settings, item.metadata?.region as string, item.id);
                } else {
                    basePrice = item.amount / 100;
                }
                subtotal += basePrice * (item.quantity || 1);
                return { ...item, basePrice };
            });

            // 2. Enterprise Logic: Dynamic Auto-Discount from Settings
            const autoDiscountEnabled = settings.autoDiscountEnabled || false;
            const threshold = settings.autoDiscountThreshold || 50;
            const discountPercent = settings.autoDiscountPercent || 10;

            const isAutoDiscount = autoDiscountEnabled && subtotal >= threshold;

            lineItems = prepared.map((item: any) => {
                let finalPrice = item.basePrice;

                if (discount) {
                    if (discount.type === 'percent') {
                        finalPrice = finalPrice * (1 - discount.value / 100);
                    } else if (discount.type === 'fixed') {
                        finalPrice = Math.max(0, finalPrice - (discount.value / items.length));
                    }
                }

                if (isAutoDiscount) {
                    finalPrice = finalPrice * (1 - discountPercent / 100);
                }

                return {
                    price_data: {
                        currency: item.currency || 'eur',
                        product_data: {
                            name: item.productName,
                            metadata: { ...item.metadata, auto_discount: isAutoDiscount ? 'true' : 'false' } as any,
                        },
                        unit_amount: Math.round(finalPrice * 100),
                    },
                    quantity: item.quantity,
                };
            });
        } else if (body.productName) {
            lineItems.push({
                price_data: {
                    currency: body.currency,
                    product_data: {
                        name: body.productName,
                        metadata: body.metadata,
                    },
                    unit_amount: body.amount,
                },
                quantity: 1,
            });
        } else {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
        const lang = body.lang || 'de';

        // Only use payment methods that are activated in Stripe Dashboard
        const paymentMethods = ['card'];
        
        // Optional: Add other payment methods if configured
        // PayPal temporarily disabled
        // if (process.env.STRIPE_ENABLE_PAYPAL === 'true') paymentMethods.push('paypal');
        if (process.env.STRIPE_ENABLE_KLARNA === 'true') paymentMethods.push('klarna');
        if (process.env.STRIPE_ENABLE_AMAZON_PAY === 'true') paymentMethods.push('amazon_pay');

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            payment_method_types: paymentMethods as any,
            success_url: `${origin}/${lang}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/${lang}`,
            metadata: {
                discount_code: discountCode || null,
                payment_intent_data: JSON.stringify({
                    items: items.map((item: any) => ({
                        name: item.productName,
                        sku: item.id,
                        region: item.metadata?.region,
                        quantity: item.quantity,
                        providerId: item.metadata?.providerId,
                        providerProductId: item.metadata?.providerProductId,
                        costPrice: item.metadata?.costPrice
                    }))
                })
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: unknown) {
        console.error('Stripe error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ statusCode: 500, message: errorMessage }, { status: 500 });
    }
}
