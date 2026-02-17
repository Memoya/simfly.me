import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prisma } = await import('@/lib/prisma');

        const body = await request.json();
        const { iccid, status, usage, dataLimit } = body;

        console.log(`[WEBHOOK-ESIM] Received update for ICCID: ${iccid}, Status: ${status}`);

        if (iccid) {
            const updateResult = await prisma.orderItem.updateMany({
                where: { iccid: iccid },
                data: {
                    activationStatus: status,
                    dataUsage: usage ? parseFloat(usage) : undefined,
                }
            });

            if (updateResult.count > 0) {
                console.log(`[WEBHOOK-ESIM] Updated ${updateResult.count} items.`);
            } else {
                console.warn(`[WEBHOOK-ESIM] ICCID ${iccid} not found in DB.`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[WEBHOOK-ESIM] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
