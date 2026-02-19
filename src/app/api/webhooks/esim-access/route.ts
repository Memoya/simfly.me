
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * eSIMAccess Webhook Handler
 * Documentation: https://docs.esimaccess.com/#6ff716a7-5b8a-47e2-bcd2-250da94ac325
 */
export async function GET() {
    return NextResponse.json({ status: 'active', message: 'eSIMAccess Webhook Endpoint' });
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('[eSIMAccess-Webhook] Received:', JSON.stringify(payload));

        const eventType = payload.eventType || payload.type;
        const data = payload.data || payload;

        if (!data.iccid && !data.orderNo) {
            return NextResponse.json({ success: false, error: 'Missing identifying data' }, { status: 400 });
        }

        switch (eventType) {
            case 'ORDER_STATUS':
                await handleOrderStatus(data as Record<string, any>);
                break;

            case 'ESIM_STATUS':
                await handleEsimStatus(data as Record<string, any>);
                break;

            case 'DATA_USAGE':
                await handleDataUsage(data as Record<string, any>);
                break;

            case 'VALIDITY_USAGE':
                await handleValidityUsage(data as Record<string, any>);
                break;

            default:
                console.warn(`[eSIMAccess-Webhook] Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[eSIMAccess-Webhook] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

async function handleOrderStatus(data: Record<string, any>) {
    const { orderNo, iccid, smdpAddress, matchingId } = data;

    const item = await prisma.orderItem.findFirst({
        where: {
            OR: [
                { iccid: iccid },
                { esimGoOrderRef: orderNo }
            ]
        }
    });

    if (item) {
        await prisma.orderItem.update({
            where: { id: item.id },
            data: {
                iccid: iccid || item.iccid,
                smdpAddress: smdpAddress || item.smdpAddress,
                matchingId: matchingId || item.matchingId,
                activationStatus: 'ALLOCATED'
            }
        });
        console.log(`[eSIMAccess-Webhook] Updated Order Item: ${item.id} for ICCID ${iccid}`);
    }
}

async function handleEsimStatus(data: Record<string, any>) {
    const { iccid, status } = data;

    await prisma.orderItem.updateMany({
        where: { iccid },
        data: {
            activationStatus: status
        }
    });
    console.log(`[eSIMAccess-Webhook] Updated activation status for ${iccid}: ${status}`);
}

async function handleDataUsage(data: Record<string, any>) {
    const { iccid, usage, total } = data;

    const usageMB = usage ? Math.floor(parseInt(usage.toString()) / 1048576) : undefined;
    const totalMB = total ? Math.floor(parseInt(total.toString()) / 1048576) : undefined;

    await prisma.orderItem.updateMany({
        where: { iccid },
        data: {
            dataUsage: usageMB,
            totalData: totalMB
        }
    });
    console.log(`[eSIMAccess-Webhook] Updated usage for ${iccid}: ${usageMB}MB / ${totalMB}MB`);
}

async function handleValidityUsage(data: Record<string, any>) {
    const { iccid, remainingDays } = data;
    console.log(`[eSIMAccess-Webhook] Validity alert for ${iccid}: ${remainingDays} days remaining`);
}
