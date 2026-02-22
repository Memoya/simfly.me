import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './components/BaseLayout';
import {
  Card,
  InfoBox,
  DataTable,
  DataRow,
  Heading,
  Paragraph,
} from './components/shared';

export interface FailureNotificationEmailProps {
  customerEmail: string;
  orderId: string;
  productName: string;
  error?: string;
}

export const FailureNotificationEmail = ({
  orderId,
  productName,
}: FailureNotificationEmailProps) => {
  return (
    <BaseLayout preview={`Deine Simfly Bestellung wird bearbeitet`}>
      <Card>
        <Heading emoji="🙏">Vielen Dank für deine Bestellung!</Heading>
        <Paragraph muted>
          Deine Zahlung wurde erfolgreich erhalten. Wir bereiten gerade deine eSIM vor.
        </Paragraph>

        <InfoBox variant="warning" title="⏳ Deine eSIM wird aktuell aktiviert">
          Du erhältst in wenigen Minuten eine weitere E-Mail mit deinem QR-Code 
          und den Aktivierungsdaten.
        </InfoBox>

        <DataTable>
          <DataRow label="Bestellung" value={productName} />
          <DataRow 
            label="Referenz" 
            value={orderId.length > 20 ? `${orderId.substring(0, 20)}...` : orderId} 
            monospace 
            highlight 
          />
        </DataTable>

        <Section style={supportSection}>
          <Text style={supportText}>
            Falls du nach 30 Minuten keine weitere E-Mail erhältst, kontaktiere uns bitte unter{' '}
            <a href="mailto:support@simfly.me" style={supportLink}>support@simfly.me</a>
          </Text>
        </Section>
      </Card>
    </BaseLayout>
  );
};

const supportSection = {
  marginTop: '24px',
  textAlign: 'center' as const,
};

const supportText = {
  fontSize: '12px',
  color: '#999',
  margin: '0',
};

const supportLink = {
  color: '#0066FF',
  textDecoration: 'none',
};

export default FailureNotificationEmail;
