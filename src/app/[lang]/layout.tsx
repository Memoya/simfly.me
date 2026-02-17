import type { Metadata } from "next";
import { i18n, type Locale } from "../../i18n-config";
import { CurrencyProvider, LOCALE_TO_CURRENCY } from "@/context/CurrencyContext";
import "./../globals.css";

import { getDictionary } from "@/lib/get-dictionary";
import { LANG_TO_OG_LOCALE } from "@/lib/lang-locale-map";
import StructuredData from "@/components/SEO/StructuredData";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang as Locale;
  // const dict = await getDictionary(lang); // dict usage replaced by hardcoded generic seo for now or mix

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
      canonical: `${baseUrl}/de`, // User requested fixed canonical to /de
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
    <html lang={lang}>
      <head>
        {/* Preload popular destination flags for instant display */}
        <link rel="preload" as="image" href="https://flagcdn.com/w160/th.png" />
        <link rel="preload" as="image" href="https://flagcdn.com/w160/de.png" />
        <link rel="preload" as="image" href="https://flagcdn.com/w160/us.png" />
        <link rel="preload" as="image" href="https://flagcdn.com/w160/tr.png" />
        <link rel="preload" as="image" href="https://flagcdn.com/w160/jp.png" />
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://flagcdn.com" />
      </head>
      <body className="antialiased">
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
              "telephone": "+49-123-456789",
              "contactType": "Customer Support",
              "areaServed": "Global"
            }
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
          {props.children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
