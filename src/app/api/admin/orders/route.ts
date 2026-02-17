import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock', {
            apiVersion: '2023-10-16' as any,
        });

        try {
            const sessions = await stripe.checkout.sessions.list({
                limit: 20,
                expand: ['data.line_items', 'data.payment_intent'],
            });

            const orders = sessions.data.map(session => ({
                id: session.id,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency,
                status: session.payment_status,
                customer_email: session.customer_details?.email || 'N/A',
                date: new Date(session.created * 1000).toISOString(),
                items: session.line_items?.data.map(item => item.description).join(', ') || 'Unknown items'
            }));

            return NextResponse.json(orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in orders route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
