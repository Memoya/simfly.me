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

        const { prisma } = await import('@/lib/prisma');
        const order = await prisma.order.findUnique({
            where: { stripeSessionId: session_id },
            include: { items: true }
        });

        if (!order || !order.items || order.items.length === 0) {
            // If not in DB yet, return a pending state so the success page can retry or wait
            return NextResponse.json({
                status: 'pending',
                message: 'Bestellung wird verarbeitet...'
            });
        }

        const item = order.items[0];

        return NextResponse.json({
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$${item.smdpAddress || 'rsp.esim-go.com'}$${item.matchingId}`,
            iccid: item.iccid || 'In Vorbereitung...',
            status: 'completed'
        });

    } catch (err: unknown) {
        console.error('Order fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
