import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card = ({ children, style }: CardProps) => (
  <Section style={{ ...card, ...style }}>{children}</Section>
);

// Button Component
interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'dark';
  fullWidth?: boolean;
}

export const Button = ({ href, children, variant = 'primary', fullWidth = false }: ButtonProps) => (
  <Section style={{ textAlign: 'center', margin: '24px 0' }}>
    <a
      href={href}
      style={{
        ...button,
        ...(variant === 'dark' ? buttonDark : buttonPrimary),
        ...(fullWidth ? { display: 'block', width: '100%' } : { display: 'inline-block' }),
      }}
    >
      {children}
    </a>
  </Section>
);

// Info Box Component  
interface InfoBoxProps {
  variant: 'success' | 'warning' | 'info' | 'error';
  title: string;
  children: React.ReactNode;
}

export const InfoBox = ({ variant, title, children }: InfoBoxProps) => {
  const variants = {
    success: { bg: '#f0fff4', border: '#9ae6b4', titleColor: '#22543d', textColor: '#2f855a' },
    warning: { bg: '#fff7e6', border: '#ffd28a', titleColor: '#b36b00', textColor: '#7a4a00' },
    info: { bg: '#f0f7ff', border: '#90cdf4', titleColor: '#2b6cb0', textColor: '#2c5282' },
    error: { bg: '#fff5f5', border: '#feb2b2', titleColor: '#c53030', textColor: '#9b2c2c' },
  };

  const v = variants[variant];

  return (
    <Section
      style={{
        backgroundColor: v.bg,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${v.border}`,
        margin: '20px 0',
      }}
    >
      <Text style={{ margin: '0 0 8px 0', fontSize: '14px', color: v.titleColor, fontWeight: '700' }}>
        {title}
      </Text>
      <Text style={{ margin: '0', fontSize: '13px', color: v.textColor, lineHeight: '1.5' }}>
        {children}
      </Text>
    </Section>
  );
};

// Data Table Row
interface DataRowProps {
  label: string;
  value: string;
  monospace?: boolean;
  highlight?: boolean;
}

export const DataRow = ({ label, value, monospace, highlight }: DataRowProps) => (
  <Row style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
    <Column style={{ width: '40%' }}>
      <Text style={dataLabel}>{label}</Text>
    </Column>
    <Column style={{ width: '60%' }}>
      <Text
        style={{
          ...dataValue,
          fontFamily: monospace ? 'monospace' : 'inherit',
          color: highlight ? '#0066FF' : '#000',
          fontSize: monospace ? '12px' : '14px',
        }}
      >
        {value}
      </Text>
    </Column>
  </Row>
);

// Data Table Container
interface DataTableProps {
  children: React.ReactNode;
}

export const DataTable = ({ children }: DataTableProps) => (
  <Section style={dataTable}>{children}</Section>
);

// QR Code Section
interface QRCodeSectionProps {
  smdpAddress: string;
  matchingId: string;
}

export const QRCodeSection = ({ smdpAddress, matchingId }: QRCodeSectionProps) => {
  const qrData = `LPA:1$${smdpAddress}$${matchingId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  return (
    <Section style={qrContainer}>
      <img src={qrUrl} alt="eSIM QR Code" width="200" height="200" style={qrImage} />
      <Text style={qrLabel}>METHODE 1: QR-CODE SCANNEN</Text>
      <Text style={qrHint}>In den Einstellungen unter "Mobilfunk" → "eSIM hinzufügen"</Text>
    </Section>
  );
};

// Activation Code Box
interface ActivationCodeProps {
  label: string;
  value: string;
}

export const ActivationCode = ({ label, value }: ActivationCodeProps) => (
  <Section style={{ marginBottom: '16px' }}>
    <Text style={codeLabel}>{label}</Text>
    <Text style={codeValue}>{value}</Text>
  </Section>
);

// Heading
interface HeadingProps {
  children: React.ReactNode;
  emoji?: string;
}

export const Heading = ({ children, emoji }: HeadingProps) => (
  <Text style={heading}>
    {children} {emoji}
  </Text>
);

// Paragraph
interface ParagraphProps {
  children: React.ReactNode;
  muted?: boolean;
  small?: boolean;
  center?: boolean;
}

export const Paragraph = ({ children, muted, small, center }: ParagraphProps) => (
  <Text
    style={{
      ...paragraph,
      color: muted ? '#666' : '#333',
      fontSize: small ? '12px' : '15px',
      textAlign: center ? 'center' : 'left',
    }}
  >
    {children}
  </Text>
);

// Divider
export const Divider = () => (
  <Section style={divider} />
);

// Styles
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  padding: '32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  border: '1px solid #f0f0f0',
  marginBottom: '24px',
};

const button = {
  padding: '16px 32px',
  borderRadius: '50px',
  fontWeight: '700' as const,
  fontSize: '14px',
  letterSpacing: '0.5px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const buttonPrimary = {
  backgroundColor: '#0066FF',
  color: '#ffffff',
};

const buttonDark = {
  backgroundColor: '#000',
  color: '#fff',
};

const dataTable = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '8px 20px',
  margin: '20px 0',
};

const dataLabel = {
  margin: '0',
  fontSize: '13px',
  color: '#666',
};

const dataValue = {
  margin: '0',
  fontSize: '14px',
  fontWeight: '700' as const,
  textAlign: 'right' as const,
};

const qrContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fff',
  border: '2px dashed #e0e0e0',
  borderRadius: '16px',
};

const qrImage = {
  display: 'block',
  margin: '0 auto 16px auto',
  borderRadius: '8px',
};

const qrLabel = {
  fontSize: '11px',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: '#999',
  margin: '0 0 4px 0',
};

const qrHint = {
  fontSize: '12px',
  color: '#666',
  margin: '0',
};

const codeLabel = {
  fontSize: '10px',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: '#999',
  margin: '0 0 6px 0',
};

const codeValue = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '13px',
  color: '#0066FF',
  backgroundColor: '#fff',
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid #dce8f5',
  margin: '0',
  wordBreak: 'break-all' as const,
};

const heading = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const paragraph = {
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const divider = {
  borderTop: '1px solid #e6e6e6',
  margin: '24px 0',
};

export default {
  Card,
  Button,
  InfoBox,
  DataRow,
  DataTable,
  QRCodeSection,
  ActivationCode,
  Heading,
  Paragraph,
  Divider,
};
