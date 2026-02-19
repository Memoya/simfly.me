
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!verifyAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Core Financials (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await prisma.order.findMany({
            where: {
                status: 'paid',
                createdAt: { gte: thirtyDaysAgo }
            },
            include: { items: true }
        });

        let totalRevenue = 0;
        let totalCost = 0;
        const providerPerformance: Record<string, { revenue: number, cost: number, count: number }> = {};

        orders.forEach(order => {
            totalRevenue += order.amount;
            order.items.forEach(item => {
                const itemCost = (item.costPrice || 0) * item.quantity;
                totalCost += itemCost;

                const pId = item.providerId || 'unknown';
                if (!providerPerformance[pId]) providerPerformance[pId] = { revenue: 0, cost: 0, count: 0 };
                providerPerformance[pId].revenue += item.price * item.quantity;
                providerPerformance[pId].cost += itemCost;
                providerPerformance[pId].count += item.quantity;
            });
        });

        const totalProfit = totalRevenue - totalCost;
        const totalROI = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

        // 2. Format Provider ROI
        const providerMetrics = Object.entries(providerPerformance).map(([id, stats]) => ({
            providerId: id,
            revenue: stats.revenue,
            profit: stats.revenue - stats.cost,
            roi: stats.cost > 0 ? ((stats.revenue - stats.cost) / stats.cost) * 100 : 0,
            volume: stats.count
        })).sort((a, b) => b.profit - a.profit);

        // 3. Activation Lifecycle Stats (Last 30 days)
        const [activationStarts, activationFailures, iosStarts, androidStarts] = await Promise.all([
            prisma.esimActivationEvent.count({
                where: { eventType: 'INSTALL_START', createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.esimActivationFailure.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.esimActivationEvent.count({
                where: { eventType: 'INSTALL_START', platform: 'ios', createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.esimActivationEvent.count({
                where: { eventType: 'INSTALL_START', platform: 'android', createdAt: { gte: thirtyDaysAgo } }
            })
        ]);

        return NextResponse.json({
            summary: {
                revenue: totalRevenue,
                cost: totalCost,
                profit: totalProfit,
                roi: totalROI,
                orderCount: orders.length,
                activationRate: orders.length > 0 ? (activationStarts / orders.length) * 100 : 0
            },
            providers: providerMetrics,
            techKpis: {
                starts: activationStarts,
                failures: activationFailures,
                ios: iosStarts,
                android: androidStarts
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
