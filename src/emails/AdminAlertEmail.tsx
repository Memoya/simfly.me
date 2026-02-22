import { Section, Text, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './components/BaseLayout';
import { Card, Heading, Paragraph } from './components/shared';

export interface AdminAlertEmailProps {
  subject: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}

export const AdminAlertEmail = ({
  subject,
  message,
  severity = 'warning',
}: AdminAlertEmailProps) => {
  const severityConfig = {
    info: { icon: 'ℹ️', color: '#0066FF', bgColor: '#f0f7ff', borderColor: '#90cdf4' },
    warning: { icon: '⚠️', color: '#b36b00', bgColor: '#fff7e6', borderColor: '#ffd28a' },
    error: { icon: '🚨', color: '#c53030', bgColor: '#fff5f5', borderColor: '#feb2b2' },
  };

  const config = severityConfig[severity];
  const timestamp = new Date().toISOString();

  return (
    <BaseLayout preview={`[ALERT] ${subject}`}>
      <Card style={{ borderLeft: `4px solid ${config.color}` }}>
        <Section style={{ ...alertHeader, backgroundColor: config.bgColor, borderColor: config.borderColor }}>
          <Text style={{ ...alertIcon }}>{config.icon}</Text>
          <Text style={{ ...alertTitle, color: config.color }}>SYSTEM ALERT</Text>
        </Section>

        <Heading>{subject}</Heading>
        
        <Section style={messageBox}>
          <Text style={messageText}>{message}</Text>
        </Section>

        <Hr style={divider} />

        <Section style={metaSection}>
          <Text style={metaLabel}>Zeitstempel</Text>
          <Text style={metaValue}>{timestamp}</Text>
        </Section>

        <Section style={metaSection}>
          <Text style={metaLabel}>Severity</Text>
          <Text style={{ ...metaValue, color: config.color, fontWeight: '700' }}>
            {severity.toUpperCase()}
          </Text>
        </Section>
      </Card>
    </BaseLayout>
  );
};

const alertHeader = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid',
};

const alertIcon = {
  fontSize: '24px',
  margin: '0 12px 0 0',
  display: 'inline',
};

const alertTitle = {
  fontSize: '11px',
  fontWeight: '700' as const,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '0',
  display: 'inline',
};

const messageBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const messageText = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '20px 0',
};

const metaSection = {
  marginBottom: '8px',
};

const metaLabel = {
  fontSize: '10px',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: '#999',
  margin: '0 0 4px 0',
};

const metaValue = {
  fontSize: '13px',
  color: '#666',
  fontFamily: 'monospace',
  margin: '0',
};

export default AdminAlertEmail;
