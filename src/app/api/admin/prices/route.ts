import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        // Dynamic imports
        const { prisma } = await import('@/lib/prisma');
        const { getCatalogue } = await import('@/lib/catalogue');

        try {
            const body = await request.json();
            const { sku, price } = body;

            if (!sku || price === undefined) {
                return NextResponse.json({ error: 'Missing sku or price' }, { status: 400 });
            }

            const newPrice = parseFloat(price);

            // 1. Fetch COGS
            const catalogue = await getCatalogue();
            const product = catalogue.find((p: any) => p.name === sku);

            if (!product) {
                return NextResponse.json({ error: 'Product not found in catalogue' }, { status: 404 });
            }

            const cogs = product.price || 0;

            // 2. Validate COGS
            if (newPrice < cogs) {
                return NextResponse.json({
                    error: `Price Validation Failed: New price (${newPrice}) is lower than COGS (${cogs}).`
                }, { status: 400 });
            }

            // 3. Save Override
            const override = await prisma.productOverride.upsert({
                where: { sku },
                update: { price: newPrice },
                create: { sku, price: newPrice }
            });

            // 4. Audit Log
            await prisma.auditLog.create({
                data: {
                    action: 'PRICE_CHANGE',
                    entity: `Product: ${sku}`,
                    details: `Updated price for ${sku} to ${newPrice} (COGS: ${cogs})`,
                    userId: 'admin'
                }
            });

            return NextResponse.json({ success: true, override });

        } catch (error) {
            console.error('[API] Price update failed:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('[API] Critical error in prices route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
