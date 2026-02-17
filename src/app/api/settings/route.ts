import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 minute

export async function GET() {
    try {
        const settings = await getSettings();

        // Expose only non-sensitive data
        const publicSettings = {
            featuredDeals: settings.featuredDeals || [],
            banner: settings.banner || { active: false, text: '', link: '' },
            faq: settings.faq || []
        };

        return NextResponse.json(publicSettings);
    } catch (error) {
        console.error('Failed to get public settings:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
