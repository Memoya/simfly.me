import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Defined as active if they pinged in the last 15 minutes
        const activeThreshold = new Date(Date.now() - 15 * 60 * 1000);

        // Use any to avoid build errors if prisma generate is still catching up
        const visitors = await (prisma as any).visitorActivity.findMany({
            where: {
                lastActive: { gte: activeThreshold }
            },
            orderBy: {
                lastActive: 'desc'
            }
        });

        // Group by sessionId to counts unique visitors
        const uniqueVisitors = Array.from(new Set(visitors.map((v: any) => v.sessionId))).length;

        return NextResponse.json({
            visitors,
            stats: {
                activeNow: uniqueVisitors
            }
        });
    } catch (error) {
        console.error('[ADMIN-VISITORS-API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
