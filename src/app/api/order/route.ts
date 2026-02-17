import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock', {
            apiVersion: '2025-01-27.acacia' as unknown as Stripe.LatestApiVersion,
        });

        const ESIM_GO_API_KEY = process.env.ESIM_GO_API_KEY;
        const ESIM_GO_URL = 'https://api.esim-go.com/v2';

        const { searchParams } = new URL(request.url);
        const session_id = searchParams.get('session_id');

        if (!session_id) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        if (session_id.startsWith('mock_session_')) {
            return NextResponse.json({
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ESIM-MOCK-SUCCESS',
                iccid: '89001234567890123456',
                status: 'completed'
            });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        if (!ESIM_GO_API_KEY || session.livemode === false) {
            return NextResponse.json({
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ESIM-MOCK-DATA',
                iccid: '89000000000000000000',
                status: 'completed'
            });
        }

        const orderResponse = await fetch(`${ESIM_GO_URL}/orders`, {
            method: 'POST',
            headers: {
                'X-API-Key': ESIM_GO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'transaction',
                assign: true,
                Order: [{
                    type: 'bundle',
                    quantity: 1,
                    item: session.metadata?.region === 'Europe' ? 'ESIM_UL_EU_10G' : 'ESIM_UL_US_20G'
                }]
            })
        });

        if (!orderResponse.ok) {
            throw new Error(`eSIM Go Order Failed: ${orderResponse.statusText}`);
        }

        const orderData = await orderResponse.json();
        const qrCodeUrl = orderData.qr_url || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ESIM-REAL-DATA-FROM-API';

        return NextResponse.json({
            qrCodeUrl: qrCodeUrl,
            iccid: orderData.iccid || 'Unknown',
            status: 'completed'
        });

    } catch (err: unknown) {
        console.error('Order fulfillment error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
