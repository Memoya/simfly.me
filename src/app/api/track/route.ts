import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

// Simple in-memory rate limiting (cleared on server restart, use Redis for prod)
const trackRequestCache = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per session

function checkRateLimit(sessionId: string): boolean {
    const now = Date.now();
    const requests = trackRequestCache.get(sessionId) || [];
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT_MAX) {
        return false; // Rate limited
    }
    
    recentRequests.push(now);
    trackRequestCache.set(sessionId, recentRequests);
    
    // Cleanup old sessions to prevent memory leak
    if (trackRequestCache.size > 10000) {
        trackRequestCache.clear();
    }
    
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId, page, lang, screenWidth, screenHeight } = body;

        if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        
        // Check rate limit
        if (!checkRateLimit(sessionId)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
        
        // Validate screen dimensions (realistic values only)
        const validWidth = screenWidth && typeof screenWidth === 'number' && screenWidth > 0 && screenWidth < 10000;
        const validHeight = screenHeight && typeof screenHeight === 'number' && screenHeight > 0 && screenHeight < 10000;
        
        if ((screenWidth !== undefined && !validWidth) || (screenHeight !== undefined && !validHeight)) {
            return NextResponse.json({ error: 'Invalid screen dimensions' }, { status: 400 });
        }
        
        // Validate page path (prevent injection)
        if (page && (page.length > 500 || !page.startsWith('/'))) {
            return NextResponse.json({ error: 'Invalid page path' }, { status: 400 });
        }
        
        // Validate language code
        if (lang && !/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
            return NextResponse.json({ error: 'Invalid language code' }, { status: 400 });
        }
        
        // Validate origin to prevent cross-site tracking requests
        const origin = req.headers.get('origin');
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? ['https://simfly.me', 'https://www.simfly.me']
            : ['http://localhost:3000', 'http://localhost:3001'];
        if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
            return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
        }
        
        // Debug logging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log('[TRACKING] Session:', { sessionId, page, lang, screenWidth, screenHeight });
        }

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
            if (process.env.NODE_ENV === 'development') {
                console.log('[TRACKING] Created record:', newRecord.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        // Log errors for monitoring (but less verbose in production)
        if (process.env.NODE_ENV === 'development') {
            console.error('[TRACKING-API] Error:', error);
            if (error instanceof Error) {
                console.error('[TRACKING-API] Error message:', error.message);
                console.error('[TRACKING-API] Stack:', error.stack);
            }
        } else {
            console.error('[TRACKING-API] Error:', error instanceof Error ? error.message : String(error));
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
