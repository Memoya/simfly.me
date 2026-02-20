import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Authentication
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

        if (token !== adminPassword) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get timeRange from query params
        const timeRange = (req.nextUrl.searchParams.get('timeRange') || '24h') as '1h' | '24h' | '7d' | '30d';
        
        // Calculate time threshold based on timeRange
        let timeThreshold: Date;
        switch (timeRange) {
            case '1h':
                timeThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
                break;
            case '7d':
                timeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
                break;
            case '30d':
                timeThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
                break;
            case '24h':
            default:
                timeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        }

        // Get all visitor data within the time range
        const visitors = await (prisma as any).visitorActivity.findMany({
            where: {
                lastActive: { gte: timeThreshold }
            },
            orderBy: {
                lastActive: 'desc'
            }
        });

        // Calculate stats
        const activeThreshold = new Date(Date.now() - 15 * 60 * 1000); // Active in last 15 minutes
        const activeNow = visitors.filter((v: any) => new Date(v.lastActive) >= activeThreshold).length;
        const uniqueVisitors = Array.from(new Set(visitors.map((v: any) => v.sessionId))).length;

        return NextResponse.json({
            visitors,
            stats: {
                activeNow,
                uniqueVisitors,
                totalSessions: visitors.length
            }
        });
    } catch (error) {
        console.error('[ADMIN-VISITORS-API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
