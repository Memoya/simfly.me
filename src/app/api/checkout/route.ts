import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Bundle } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { getSettings, applyMargin } = await import('@/lib/settings');
        const { getCatalogue } = await import('@/lib/catalogue');

        // Initialize Stripe inside the handler to ensure fresh config/version
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock', {
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

            lineItems = items.map((item: { id?: string, currency: string, productName: string, metadata: Record<string, unknown>, amount: number, quantity: number }) => {
                let finalPrice: number;

                const bundle = item.id ? catalogue.find((b: Bundle) => b.name === item.id) : undefined;

                if (bundle) {
                    finalPrice = applyMargin(bundle.price, settings, item.metadata?.region as string);
                } else {
                    finalPrice = item.amount / 100;
                }

                if (discount) {
                    if (discount.type === 'percent') {
                        finalPrice = finalPrice * (1 - discount.value / 100);
                    } else if (discount.type === 'fixed') {
                        finalPrice = Math.max(0, finalPrice - discount.value);
                    }
                }

                return {
                    price_data: {
                        currency: item.currency,
                        product_data: {
                            name: item.productName,
                            metadata: item.metadata as Stripe.MetadataParam,
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

        const isMockMode = !process.env.STRIPE_SECRET_KEY ||
            process.env.STRIPE_SECRET_KEY === 'mock_key' ||
            process.env.STRIPE_SECRET_KEY.startsWith('pk_');

        if (isMockMode) {
            console.log('Using Mock Checkout (Secret Key missing or invalid)');
            const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
            return NextResponse.json({ url: `${origin}/success?session_id=mock_session_${Date.now()}` });
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            payment_method_types: ['card', 'paypal', 'klarna', 'amazon_pay'],
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
            metadata: {
                discount_code: discountCode || null,
                payment_intent_data: JSON.stringify({
                    items: items.map((item: { productName: string, metadata: Record<string, unknown>, quantity: number }) => ({
                        name: item.productName,
                        region: item.metadata?.region,
                        quantity: item.quantity
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
