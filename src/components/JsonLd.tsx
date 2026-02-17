export default function JsonLd({ dictionary, lang }: { dictionary: any, lang: string }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Simfly.me',
        url: 'https://simfly.me',
        logo: 'https://simfly.me/logo.png',
        sameAs: [
            'https://twitter.com/simflyme',
            'https://instagram.com/simfly.me'
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+49-123-456789', // TODO: Update with real contact if available
            contactType: lang === 'de' ? 'Kundenservice' : 'Customer Support',
            areaServed: 'Global',
            availableLanguage: [
                'German', 'English', 'Spanish', 'French', 'Italian',
                'Turkish', 'Portuguese', 'Dutch', 'Japanese', 'Chinese',
                'Greek', 'Russian', 'Swedish', 'Norwegian', 'Danish',
                'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian',
                'Korean', 'Thai', 'Hindi'
            ]
        }
    };

    const websiteLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: dictionary.metadata.title,
        url: `https://simfly.me/${lang}`,
        potentialAction: {
            '@type': 'SearchAction',
            target: `https://simfly.me/${lang}/?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
            />
        </>
    );
}
