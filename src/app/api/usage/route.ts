import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const iccid = searchParams.get('iccid');

    if (!iccid) {
        return NextResponse.json({ error: 'ICCID is required' }, { status: 400 });
    }

    const isTestMode = process.env.ESIM_ACCESS_TEST_MODE === 'true';

    if (isTestMode) {
        // Mock Response for testing
        return NextResponse.json({
            iccid,
            totalData: 10, // GB
            remainingData: 8.5, // GB
            status: 'active',
            expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), // +15 days
            bundles: [
                { name: 'esim_10gb_30d', assignments: [{ status: 'active', initialQuantity: 10737418240, remainingQuantity: 9126805504 }] }
            ]
        });
    }

    try {
        const { prisma } = await import('@/lib/prisma');
        const item = await prisma.orderItem.findFirst({
            where: { iccid }
        });

        if (!item) {
            return NextResponse.json({ error: 'eSIM not found' }, { status: 404 });
        }

        const totalMB = item.totalData ?? 0;
        const usedMB = item.dataUsage ?? 0;
        const remainingMB = Math.max(0, totalMB - usedMB);

        return NextResponse.json({
            iccid,
            totalData: Number((totalMB / 1024).toFixed(2)),
            remainingData: Number((remainingMB / 1024).toFixed(2)),
            status: item.activationStatus || 'unknown',
            expiryDate: null
        });
    } catch (error) {
        console.error('Usage check failed:', error);
        return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }
}
