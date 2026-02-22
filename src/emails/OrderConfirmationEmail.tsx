import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './components/BaseLayout';
import {
  Card,
  Button,
  QRCodeSection,
  ActivationCode,
  DataTable,
  DataRow,
  Heading,
  Paragraph,
  Divider,
} from './components/shared';

export interface OrderConfirmationEmailProps {
  customerEmail: string;
  orderId: string;
  productName: string;
  dataAmount: string;
  duration: string;
  iccid?: string;
  matchingId?: string;
  smdpAddress?: string;
  baseUrl?: string;
}

export const OrderConfirmationEmail = ({
  orderId,
  productName,
  dataAmount,
  duration,
  iccid,
  matchingId,
  smdpAddress,
  baseUrl = 'https://simfly.me',
}: OrderConfirmationEmailProps) => {
  const hasActivation = Boolean(smdpAddress && matchingId);
  const installUrl = `${baseUrl}/de/install?address=${smdpAddress}&matchingId=${matchingId}`;
  const checkUrl = `${baseUrl}/check?iccid=${iccid || ''}`;

  return (
    <BaseLayout
      preview={`Deine eSIM für ${productName} ist bereit! 🌍`}
      footerText={`Bestell-Ref: ${orderId} | Status: Verified`}
    >
      <Card>
        <Heading emoji="✈️">Gute Reise!</Heading>
        <Paragraph muted>
          Vielen Dank für deine Bestellung. Deine eSIM ist bereit zur Aktivierung. 
          Nutze eine der folgenden Methoden:
        </Paragraph>

        {/* QR Code Section */}
        {hasActivation ? (
          <QRCodeSection smdpAddress={smdpAddress!} matchingId={matchingId!} />
        ) : (
          <Section style={pendingBox}>
            <Text style={pendingTitle}>QR-CODE WIRD VORBEREITET</Text>
            <Text style={pendingText}>
              Sobald die Aktivierungsdaten vorliegen, senden wir dir eine zweite E-Mail.
            </Text>
          </Section>
        )}

        {/* iOS Direct Install & Manual Activation */}
        {hasActivation && (
          <Section style={activationSection}>
            {/* iOS Button */}
            <Section style={methodBox}>
              <Text style={methodTitle}>METHODE 2: DIREKT-AKTIVIERUNG (iOS)</Text>
              <Paragraph small muted>
                Nur für iPhones: Klicke auf den Button, um das eSIM-Menü direkt zu öffnen.
              </Paragraph>
              <Section style={{ textAlign: 'center', margin: '16px 0 0 0' }}>
                <a href={installUrl} style={darkButton}>
                  JETZT AUF iPHONE INSTALLIEREN
                </a>
              </Section>
            </Section>

            <Divider />

            {/* Manual Entry */}
            <Section style={methodBox}>
              <Text style={methodTitle}>METHODE 3: MANUELLE EINGABE</Text>
              <Paragraph small muted>
                Falls Methode 1 & 2 nicht funktionieren (z.B. Android), gib diese Daten manuell ein:
              </Paragraph>
              <ActivationCode label="SM-DP+ Adresse" value={smdpAddress!} />
              <ActivationCode label="Aktivierungscode" value={matchingId!} />
            </Section>
          </Section>
        )}

        {/* Order Details */}
        <DataTable>
          <DataRow label="Region / Paket" value={productName} />
          <DataRow label="Datenvolumen" value={dataAmount} />
          <DataRow label="Laufzeit" value={duration} />
          {iccid && <DataRow label="ICCID" value={iccid} monospace highlight />}
        </DataTable>

        {/* Check Button */}
        <Button href={checkUrl}>DATENVOLUMEN PRÜFEN</Button>
      </Card>
    </BaseLayout>
  );
};

// Additional Styles
const pendingBox = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fff7e6',
  border: '1px dashed #ffd28a',
  borderRadius: '16px',
};

const pendingTitle = {
  fontSize: '12px',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: '#b36b00',
  margin: '0 0 8px 0',
};

const pendingText = {
  fontSize: '13px',
  color: '#7a4a00',
  margin: '0',
};

const activationSection = {
  backgroundColor: '#f0f7ff',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #e0eeff',
  margin: '24px 0',
};

const methodBox = {
  marginBottom: '0',
};

const methodTitle = {
  fontSize: '12px',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: '#0066FF',
  margin: '0 0 12px 0',
};

const darkButton = {
  display: 'block',
  backgroundColor: '#000',
  color: '#fff',
  textDecoration: 'none',
  padding: '16px 24px',
  borderRadius: '12px',
  fontWeight: '700' as const,
  fontSize: '13px',
  textAlign: 'center' as const,
  letterSpacing: '0.5px',
};

export default OrderConfirmationEmail;
