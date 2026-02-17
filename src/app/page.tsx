import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { i18n } from '../i18n-config';

export default async function RootPage() {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language') || '';

    // Detect preferred language from accept-language header
    const preferredLang = i18n.locales.find(locale =>
        acceptLanguage.toLowerCase().includes(locale)
    ) || i18n.defaultLocale;

    redirect(`/${preferredLang}`);
}
