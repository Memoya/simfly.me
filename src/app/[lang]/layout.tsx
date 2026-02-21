import type { Metadata } from "next";
import { i18n, type Locale } from "../../i18n-config";
import { CurrencyProvider, LOCALE_TO_CURRENCY } from "@/context/CurrencyContext";
import "./../globals.css";

import { LANG_TO_OG_LOCALE } from "@/lib/lang-locale-map";
import StructuredData from "@/components/SEO/StructuredData";
import { VisitorTracker } from "@/components/VisitorTracker";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang as Locale;

  const baseUrl = 'https://simfly.me';

  // Create alternates for all languages
  const languages: Record<string, string> = {
    'x-default': `${baseUrl}/de`,
  };

  i18n.locales.forEach((locale) => {
    languages[locale] = `${baseUrl}/${locale}`;
  });

  const title = "Simfly.me | Premium Reise-eSIMs – Grenzenlos verbunden";
  const description = "Günstige Reise-eSIMs für Thailand, USA, Türkei & 190+ Länder. Sofortige Aktivierung via QR-Code. Kein SIM-Karten-Wechsel nötig.";
  const keywords = ["eSIM", "Reise-SIM", "Ausland Internet", "simfly", "günstige eSIM Thailand", "eSIM USA"];

  return {
    title: title,
    description: description,
    keywords: keywords,
    authors: [{ name: "Simfly.me Team" }],
    manifest: `/${lang}/manifest.webmanifest`,
    openGraph: {
      title: title,
      description: description,
      type: "website",
      locale: LANG_TO_OG_LOCALE[lang],
      siteName: "Simfly.me",
      url: `${baseUrl}/${lang}`,
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages,
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const lang = params.lang as Locale;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://simfly.me';
  const defaultCurrency = LOCALE_TO_CURRENCY[lang] || 'EUR';

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://flagcdn.com" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <StructuredData
          type="Organization"
          data={{
            name: "Simfly.me",
            url: baseUrl,
            logo: `${baseUrl}/logo.png`,
            sameAs: [
              "https://twitter.com/simflyme",
              "https://instagram.com/simfly.me"
            ],
            contactPoint: {
              "@type": "ContactPoint",
              "email": "hello@simfly.me",
              "contactType": "customer service"
            }
          }}
        />
        <StructuredData
          type="FAQPage"
          data={{
            mainEntity: [
              {
                "@type": "Question",
                "name": "Was ist eine eSIM?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Eine eSIM ist eine digitale SIM-Karte, mit der du einen Mobilfunktarif bei deinem Anbieter aktivieren kannst, ohne eine physische SIM-Karte verwenden zu müssen."
                }
              },
              {
                "@type": "Question",
                "name": "Wann erhalte ich meinen QR-Code?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Dein QR-Code wird sofort nach erfolgreicher Zahlung per E-Mail verschickt. Du kannst ihn direkt scannen und die eSIM aktivieren."
                }
              },
              {
                "@type": "Question",
                "name": "Funktioniert mein Handy mit Simfly?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Die meisten modernen Smartphones ab 2019 (iPhone 11, Pixel 3, Samsung S20 etc.) unterstützen eSIM. Du kannst dies in unseren Einstellungen unter 'eSIM-Kompatibilität' prüfen."
                }
              }
            ]
          }}
        />
        <StructuredData
          type="WebSite"
          data={{
            name: "Simfly.me",
            url: `${baseUrl}/${lang}`,
            potentialAction: {
              "@type": "SearchAction",
              "target": `${baseUrl}/${lang}/?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          }}
        />
        <CurrencyProvider defaultCurrency={defaultCurrency}>
          <VisitorTracker />
          {props.children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
