import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Authentication
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const adminPassword = process.env.ADMIN_PASSWORD;

        console.log('[VISITOR-API] Auth Debug:', {
            hasToken: !!token,
            tokenLength: token?.length,
            hasAdminPassword: !!adminPassword,
            passwordLength: adminPassword?.length,
            passwordFromEnv: adminPassword ? 'SET' : 'MISSING',
            isProduction: process.env.NODE_ENV === 'production'
        });

        if (!adminPassword) {
            console.error('[VISITOR-API] CRITICAL: ADMIN_PASSWORD not set in environment!');
            return NextResponse.json({ error: 'Server error: ADMIN_PASSWORD not configured' }, { status: 500 });
        }

        if (token !== adminPassword) {
            console.log('[VISITOR-API] Unauthorized - password mismatch', {
                receivedLength: token?.length,
                expectedLength: adminPassword.length,
                match: token === adminPassword
            });
            return NextResponse.json({ 
                error: 'Unauthorized', 
                debug: {
                    tokenProvided: !!token,
                    tokenLength: token?.length,
                    expectedLength: adminPassword.length,
                    message: 'Password does not match ADMIN_PASSWORD environment variable'
                }
            }, { status: 401 });
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
        const visitors = await prisma.visitorActivity.findMany({
            where: {
                lastActive: { gte: timeThreshold }
            },
            orderBy: {
                lastActive: 'desc'
            }
        });

        console.log('[VISITOR-API] ✅ Authenticated! Query result:', { timeRange, timeThreshold: timeThreshold.toISOString(), count: visitors.length });

        // Calculate stats
        const activeThreshold = new Date(Date.now() - 15 * 60 * 1000); // Active in last 15 minutes
        const activeNow = visitors.filter((v: any) => new Date(v.lastActive) >= activeThreshold).length;
        const uniqueVisitors = Array.from(new Set(visitors.map((v: any) => v.sessionId))).length;

        const response = {
            visitors,
            stats: {
                activeNow,
                uniqueVisitors,
                totalSessions: visitors.length
            }
        };

        console.log('[VISITOR-API] Sending response:', { activeNow, uniqueVisitors, totalSessions: visitors.length });

        return NextResponse.json(response);
    } catch (error) {
        console.error('[ADMIN-VISITORS-API] Error:', error);
        if (error instanceof Error) {
            console.error('[ADMIN-VISITORS-API] Message:', error.message);
            console.error('[ADMIN-VISITORS-API] Stack:', error.stack);
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
