import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' as any });
        const { id } = await params;

        // Dynamic import for prisma to avoid build time initialization
        const { prisma } = await import('@/lib/prisma');

        try {
            // 1. Find Local Order
            const order = await prisma.order.findUnique({
                where: { stripeSessionId: id },
                include: {
                    items: true,
                    providerSync: true
                }
            });

            // 1.5 Fetch Product Costs (for margin calc)
            const productNames = order?.items.map((i: any) => i.productName) || [];
            const products = await prisma.product.findMany({
                where: { name: { in: productNames } },
                select: { name: true, price: true }
            });
            const productCosts = products.reduce((acc: any, p: any) => ({ ...acc, [p.name]: p.price }), {});

            // 2. Fetch Stripe Session (Live)
            let stripeSession = null;
            try {
                stripeSession = await stripe.checkout.sessions.retrieve(id, {
                    expand: ['payment_intent']
                });
            } catch (e) {
                console.error('Stripe fetch failed:', e);
            }

            // 3. Fetch eSIM Go Status (Live)
            const esimStatus: any[] = [];
            if (order?.items) {
                for (const item of order.items) {
                    if (item.iccid) {
                        try {
                            const res = await fetch(`https://api.esim-go.com/v2.2/esims/${item.iccid}`, {
                                headers: { 'X-API-Key': process.env.ESIM_GO_API_KEY || '' }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                esimStatus.push({ iccid: item.iccid, status: data.status, bundle: data.bundle });
                            }
                        } catch (e) {
                            console.error('eSIM Go fetch failed:', e);
                        }
                    }
                }
            }

            // 4. Fetch Resend Status (Live)
            let emailStatus = null;
            if (order?.providerSync?.resendMessageId) {
                try {
                    const res = await fetch(`https://api.resend.com/emails/${order.providerSync.resendMessageId}`, {
                        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` }
                    });
                    if (res.ok) {
                        emailStatus = await res.json();
                    }
                } catch (e) {
                    console.error('Resend fetch failed:', e);
                }
            }

            return NextResponse.json({
                local: order,
                stripe: stripeSession,
                esim: esimStatus,
                email: emailStatus,
                productCosts
            });

        } catch (error) {
            console.error('[API] Order detail fetch failed:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('[API] Critical error in order detail route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
