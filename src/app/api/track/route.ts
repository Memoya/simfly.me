import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId, page, lang, screenWidth, screenHeight } = body;

        if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        
        // Debug logging
        console.log('[TRACKING] Session:', { sessionId, page, lang, screenWidth, screenHeight });

        const uaString = req.headers.get('user-agent') || '';
        const parser = new UAParser(uaString);
        const browser = parser.getBrowser();
        const device = parser.getDevice();
        const os = parser.getOS();

        const browserInfo = browser.name ? `${browser.name} ${browser.version || ''}` : 'Unknown Browser';
        const deviceInfo = device.type || (uaString.includes('Mobi') ? 'mobile' : 'desktop');
        const osInfo = os.name || 'Unknown OS';
        const osVersion = os.version || undefined;
        const referrer = req.headers.get('referer') || undefined;

        // Update or create visitor activity
        // Using upsert would be ideal but we use cuid for ID and sessionId for grouping
        // We look for a recent entry (last 15 mins) for this session to update or create new
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const existing = await prisma.visitorActivity.findFirst({
            where: {
                sessionId: sessionId,
                lastActive: { gte: fifteenMinutesAgo }
            },
            orderBy: { lastActive: 'desc' }
        });

        if (existing) {
            await prisma.visitorActivity.update({
                where: { id: existing.id },
                data: {
                    page: page,
                    lang: lang,
                    lastActive: new Date()
                }
            });
        } else {
            const newRecord = await prisma.visitorActivity.create({
                data: {
                    sessionId,
                    page,
                    lang,
                    browser: browserInfo,
                    device: deviceInfo,
                    os: osInfo,
                    osVersion: osVersion,
                    ip: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
                    referrer: referrer,
                    screenWidth: screenWidth ? Number(screenWidth) : null,
                    screenHeight: screenHeight ? Number(screenHeight) : null
                }
            });
            console.log('[TRACKING] Created record:', newRecord.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[TRACKING-API] Error:', error);
        if (error instanceof Error) {
            console.error('[TRACKING-API] Error message:', error.message);
            console.error('[TRACKING-API] Stack:', error.stack);
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
