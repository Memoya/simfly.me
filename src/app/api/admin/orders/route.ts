import { NextResponse } from 'next/server';

import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        // Dynamic import to avoid build issues
        const { prisma } = await import('@/lib/prisma');

        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { items: true }
        });

        // Collect all product names to fetch durations
        const productNames = [...new Set(orders.flatMap(o => o.items.map(i => i.productName)))];
        const products = await prisma.product.findMany({
            where: { name: { in: productNames } },
            select: { name: true, duration: true }
        });
        const durationMap = products.reduce((acc, p) => ({ ...acc, [p.name]: p.duration }), {} as Record<string, number | null>);

        const formattedOrders = orders.map(order => {
            const itemDescriptions = order.items.map(item => item.productName).join(', ');
            const durations = order.items.map(item => {
                const d = durationMap[item.productName];
                return d ? `${d} Tage` : 'N/A';
            }).join(', ');

            return {
                id: order.stripeSessionId, // Use Stripe ID for compatibility with detail view
                localId: order.id,
                amount: order.amount,
                currency: order.currency,
                status: order.status,
                customer_email: order.customerEmail || 'N/A',
                date: order.createdAt.toISOString(),
                items: itemDescriptions || 'Unknown items',
                duration: durations // New field for frontend
            };
        });

        return NextResponse.json(formattedOrders);

    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
