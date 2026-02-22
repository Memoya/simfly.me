import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Font,
} from '@react-email/components';
import * as React from 'react';

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
  footerText?: string;
}

export const BaseLayout = ({
  preview,
  children,
  footerText,
}: BaseLayoutProps) => (
  <Html>
    <Head>
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Helvetica"
        webFont={{
          url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
          format: 'woff2',
        }}
        fontWeight={400}
        fontStyle="normal"
      />
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Helvetica"
        webFont={{
          url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2',
          format: 'woff2',
        }}
        fontWeight={700}
        fontStyle="normal"
      />
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Helvetica"
        webFont={{
          url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
          format: 'woff2',
        }}
        fontWeight={900}
        fontStyle="normal"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logo}>
            SIMFLY<span style={logoAccent}>.ME</span>
          </Text>
        </Section>

        {/* Content */}
        {children}

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerBrand}>Simfly.me - Premium Global eSIM</Text>
          {footerText && <Text style={footerMeta}>{footerText}</Text>}
          <Text style={footerLinks}>
            <a href="https://simfly.me/de/datenschutz" style={footerLink}>Datenschutz</a>
            {' • '}
            <a href="https://simfly.me/de/impressum" style={footerLink}>Impressum</a>
            {' • '}
            <a href="mailto:support@simfly.me" style={footerLink}>support@simfly.me</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  fontSize: '28px',
  fontWeight: '900' as const,
  color: '#000',
  letterSpacing: '-0.5px',
  margin: '0',
};

const logoAccent = {
  color: '#0066FF',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '40px',
  paddingTop: '24px',
  borderTop: '1px solid #e6e6e6',
};

const footerBrand = {
  fontSize: '13px',
  fontWeight: '600' as const,
  color: '#666',
  margin: '0 0 8px 0',
};

const footerMeta = {
  fontSize: '11px',
  color: '#999',
  margin: '0 0 16px 0',
};

const footerLinks = {
  fontSize: '11px',
  color: '#999',
  margin: '0',
};

const footerLink = {
  color: '#666',
  textDecoration: 'none',
};

export default BaseLayout;
