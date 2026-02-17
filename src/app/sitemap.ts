import { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';

// Priority languages (shown by default)
const PRIORITY_LANGS = ['de', 'en', 'es', 'fr', 'it', 'tr', 'pt', 'nl', 'ja', 'zh'];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://simfly.me';
    const entries: MetadataRoute.Sitemap = [];

    // Add all language versions of the homepage
    i18n.locales.forEach((locale) => {
        const priority = locale === 'de' ? 1.0 :
            PRIORITY_LANGS.includes(locale) ? 0.9 : 0.8;

        entries.push({
            url: `${baseUrl}/${locale}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority,
        });
    });

    // Add legal pages (only in German for now - can be expanded later)
    const legalPages = ['impressum', 'agb', 'datenschutz'];
    legalPages.forEach((page) => {
        entries.push({
            url: `${baseUrl}/${page}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        });
    });

    return entries;
}
