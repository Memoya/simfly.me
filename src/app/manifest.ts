import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Simfly.me – Deine Reise-eSIM',
        short_name: 'Simfly',
        description: 'Premium eSIM Lösungen für Thailand, USA, Türkei & weltweit. Sofort online nach der Landung.',
        start_url: '/',
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
