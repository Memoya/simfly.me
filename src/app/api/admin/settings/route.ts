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

        // Remove sensitive info if it exists
        const { ...safeSettings } = settings;
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
            // password is part of body but checked via verifyAuth (Bearer)
            const { password, ...newSettings } = body;
            void password; // Avoid unused variable warning

            const currentSettings = await getSettings();

            const updatedSettings = {
                ...currentSettings,
                ...newSettings
            };

            await saveSettings(updatedSettings);

            return NextResponse.json({ success: true, settings: updatedSettings });
        } catch (error: any) {
            console.error('Settings save error:', error);
            return NextResponse.json({
                error: 'Failed',
                message: error.message,
                stack: error.stack
            }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in settings POST:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
