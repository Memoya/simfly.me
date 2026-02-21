import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ lang: string }> }) {
    const resolvedParams = await params;
    const lang = resolvedParams.lang || 'de';

    const manifest = {
        name: 'Simfly.me – Deine Reise-eSIM',
        short_name: 'Simfly',
        description: 'Premium eSIM Loesungen fuer Thailand, USA, Tuerkei und weltweit. Sofort online nach der Landung.',
        start_url: `/${lang}/`,
        scope: `/${lang}/`,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    };

    return NextResponse.json(manifest, {
        headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
        },
    });
}
