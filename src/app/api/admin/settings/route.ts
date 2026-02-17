import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        // Dynamic import
        const { getSettings } = await import('@/lib/settings');
        const settings = await getSettings();

        const { passwordHash, ...safeSettings } = settings;
        return NextResponse.json(safeSettings);
    } catch (error) {
        console.error('Failed to get settings:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        // Dynamic import
        const { getSettings, saveSettings } = await import('@/lib/settings');

        try {
            const body = await request.json();
            const { password, ...newSettings } = body;

            const currentSettings = await getSettings();

            if (password !== currentSettings.passwordHash) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const updatedSettings = {
                ...currentSettings,
                ...newSettings,
                passwordHash: currentSettings.passwordHash
            };

            await saveSettings(updatedSettings);

            return NextResponse.json({ success: true, settings: updatedSettings });
        } catch (error) {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in settings POST:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
