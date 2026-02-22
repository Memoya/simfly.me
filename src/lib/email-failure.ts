/**
 * Failure Notification Email
 * Uses React Email Templates for beautiful, maintainable emails.
 */

import { render } from '@react-email/components';
import { FailureNotificationEmail } from '@/emails/FailureNotificationEmail';

export interface FailureNotificationData {
    customerEmail: string;
    orderId: string;
    productName: string;
    error?: string;
}

export async function sendFailureNotification(data: FailureNotificationData) {
    console.log(`[MAIL] Sending failure notification to ${data.customerEmail}`);

    try {
        // Render React Email template to HTML
        const emailHtml = await render(
            FailureNotificationEmail({
                customerEmail: data.customerEmail,
                orderId: data.orderId,
                productName: data.productName,
                error: data.error,
            })
        );

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'Simfly <onboarding@resend.dev>',
                to: data.customerEmail,
                subject: `Deine Simfly Bestellung wird bearbeitet`,
                html: emailHtml,
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[MAIL] Failed to send failure notification:', errorText);
            return { success: false, error: 'Email delivery failed' };
        }

        const dataRes = await res.json();
        console.log(`[MAIL] Failure notification sent to ${data.customerEmail}. ID: ${dataRes.id}`);
        return { success: true, id: dataRes.id };

    } catch (error) {
        console.error('[MAIL] Error sending failure notification:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}
