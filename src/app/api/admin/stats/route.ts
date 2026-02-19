import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
            // Fetch last 100 paid sessions for stats
            const sessions = await stripe.checkout.sessions.list({
                limit: 100,
                status: 'complete',
                expand: ['data.line_items'],
            });

            const totalRevenue = sessions.data.reduce((sum, s) => sum + (s.amount_total || 0), 0) / 100;
            const totalOrders = sessions.data.length;
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Activation Stats
            const [activationStarts, activationFailures] = await Promise.all([
                prisma.esimActivationEvent.count({ where: { eventType: 'INSTALL_START' } }),
                prisma.esimActivationFailure.count()
            ]);

            const iosStarts = await prisma.esimActivationEvent.count({ where: { eventType: 'INSTALL_START', platform: 'ios' } });
            const androidStarts = await prisma.esimActivationEvent.count({ where: { eventType: 'INSTALL_START', platform: 'android' } });

            // Simple aggregation for "Top Countries" based on product names
            const countryCounts: Record<string, number> = {};
            sessions.data.forEach(s => {
                s.line_items?.data.forEach(item => {
                    const desc = item.description || '';
                    countryCounts[desc] = (countryCounts[desc] || 0) + 1;
                });
            });

            const topProducts = Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));

            return NextResponse.json({
                revenue: totalRevenue,
                orders: totalOrders,
                averageOrderValue,
                topProducts,
                activationStats: {
                    starts: activationStarts,
                    failures: activationFailures,
                    ios: iosStarts,
                    android: androidStarts
                }
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            return NextResponse.json({
                revenue: 0,
                orders: 0,
                averageOrderValue: 0,
                topProducts: [],
                activationStats: { starts: 0, failures: 0, ios: 0, android: 0 }
            });
        }
    } catch (outerError) {
        console.error('Critical error in stats route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
