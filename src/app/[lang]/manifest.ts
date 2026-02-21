import { MetadataRoute } from 'next';

export default function manifest({ params }: { params: { lang: string } }): MetadataRoute.Manifest {
    const lang = params.lang || 'de';

    return {
        name: 'Simfly.me – Deine Reise-eSIM',
        short_name: 'Simfly',
        description: 'Premium eSIM Loesungen fuer Thailand, USA, Tuerkei und weltweit. Sofort online nach der Landung.',
        start_url: `/${lang}`,
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
}
