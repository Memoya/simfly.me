
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
    if (!verifyAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'US';
    const dataAmount = parseInt(searchParams.get('data') || '1000'); // MB
    const days = parseInt(searchParams.get('days') || '7');

    try {
        const matches = (await prisma.providerProduct.findMany({
            where: {
                OR: [
                    { countryCode: country.toUpperCase() },
                    { countryCode: 'global' },
                    { countryCode: 'multi' }
                ],
                dataAmountMB: { gte: dataAmount - 100 }, // Close matches
                validityDays: { gte: days - 1 },
                provider: { isActive: true }
            },
            include: {
                provider: {
                    select: { name: true, slug: true, priority: true }
                }
            },
            orderBy: [
                { price: 'asc' },
                { provider: { priority: 'desc' } }
            ],
            take: 10
        })) as any[];

        // Calculate recommendations
        const bestDeal = matches[0];
        const recommendation = bestDeal ? {
            reason: `Cheapest deal for ${country} / ${dataAmount}MB`,
            savings: matches.length > 1 ? matches[1].price - bestDeal.price : 0
        } : null;

        return NextResponse.json({
            results: matches,
            recommendation,
            totalScanned: matches.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
