import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock', {
            apiVersion: '2023-10-16' as any,
        });

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

        // Handle test sessions (cs_test_...)
        if (session_id.startsWith('cs_test_')) {
            const { prisma } = await import('@/lib/prisma');
            const order = await prisma.order.findUnique({
                where: { stripeSessionId: session_id },
                include: { items: true }
            });

            if (order && order.items && order.items.length > 0) {
                // Return test data
                return NextResponse.json({
                    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TEST-ESIM-SUCCESS',
                    iccid: order.items[0]?.iccid || `TEST${Date.now()}`,
                    smdpAddress: 'smdp.example.test',
                    matchingId: `TEST-${Math.random().toString(36).slice(2, 10)}`,
                    status: 'completed'
                });
            }
        }

        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['payment_intent']
        });

        // Get Receipt URL
        let receiptUrl = '';
        if (session.payment_intent && typeof session.payment_intent !== 'string') {
            const pi = session.payment_intent as any;
            if (pi.charges && pi.charges.data.length > 0) {
                receiptUrl = pi.charges.data[0].receipt_url || '';
            }
        }

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        const { prisma } = await import('@/lib/prisma');
        const order = await prisma.order.findUnique({
            where: { stripeSessionId: session_id },
            include: { items: true }
        });

        if (!order || !order.items || order.items.length === 0) {
            return NextResponse.json({
                status: 'pending',
                message: 'Bestellung wird verarbeitet...'
            });
        }

        const item = order.items[0];

        const smdpAddress = item.smdpAddress || '';
        const matchingId = item.matchingId || '';
        const hasActivation = Boolean(smdpAddress && matchingId);

        return NextResponse.json({
            qrCodeUrl: hasActivation
                ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$${smdpAddress}$${matchingId}`
                : '',
            iccid: item.iccid || 'In Vorbereitung...',
            smdpAddress,
            matchingId,
            status: 'completed',
            receiptUrl: receiptUrl
        });

    } catch (err: unknown) {
        console.error('Order fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
