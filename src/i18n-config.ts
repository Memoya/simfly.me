export const i18n = {
    defaultLocale: 'de',
    locales: [
        'de', 'en', 'es', 'fr', 'it', 'tr', 'pt', 'nl', 'ja', 'zh',  // Priority 1
        'el', 'ru', 'sv', 'no', 'da', 'fi', 'pl', 'cs', 'hu', 'ro', 'ko', 'th', 'hi'  // More Languages
    ],
} as const;

export type Locale = (typeof i18n)['locales'][number];
