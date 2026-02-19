import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { iccid, orderId, eventType, platform, method, errorCode, errorMessage } = body;

        if (eventType === 'FAILURE') {
            await prisma.esimActivationFailure.create({
                data: {
                    iccid,
                    errorCode,
                    errorMessage,
                    platform: platform || 'unknown'
                }
            });
        } else {
            await prisma.esimActivationEvent.create({
                data: {
                    iccid: iccid || 'unknown',
                    orderId: orderId || 'unknown',
                    eventType,
                    platform: platform || 'unknown',
                    method: method || 'unknown'
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to log activation event:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
