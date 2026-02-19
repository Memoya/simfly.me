
import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        const { getSettings } = await import('@/lib/settings');
        const settings = await getSettings();
        return NextResponse.json(settings);
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

        const { getSettings, saveSettings } = await import('@/lib/settings');

        try {
            const body = await request.json();
            const { password, ...newSettings } = body;
            void password;

            const currentSettings = await getSettings();

            const updatedSettings = {
                ...currentSettings,
                ...newSettings
            };

            await saveSettings(updatedSettings);

            // ENTERPRISE AUDIT LOG
            const { prisma } = await import('@/lib/prisma');
            await prisma.auditLog.create({
                data: {
                    action: 'UPDATE_SETTINGS',
                    entity: 'Global Admin Settings',
                    userId: 'Admin',
                    details: JSON.stringify({
                        changed: Object.keys(newSettings).filter(k =>
                            JSON.stringify((newSettings as any)[k]) !==
                            JSON.stringify((currentSettings as any)[k])
                        )
                    })
                }
            });

            return NextResponse.json({ success: true, settings: updatedSettings });
        } catch (error: any) {
            console.error('Settings save error:', error);
            return NextResponse.json({
                error: 'Failed',
                message: error.message
            }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in settings POST:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
