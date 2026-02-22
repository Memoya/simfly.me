/**
 * Email Utility for Simfly.me
 * Uses React Email Templates for beautiful, maintainable emails.
 */

import { render } from '@react-email/components';
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail';
import { AdminAlertEmail } from '@/emails/AdminAlertEmail';

export interface OrderEmailData {
    customerEmail: string;
    orderId: string;
    productName: string;
    qrCodeUrl: string; // URL from eSIM Go
    dataAmount: string;
    duration: string;
    iccid?: string;
    matchingId?: string;
    smdpAddress?: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
    console.log(`[MAIL] Preparing to send order confirmation to ${data.customerEmail}`);

    try {
        // Render React Email template to HTML
        const emailHtml = await render(
            OrderConfirmationEmail({
                customerEmail: data.customerEmail,
                orderId: data.orderId,
                productName: data.productName,
                dataAmount: data.dataAmount,
                duration: data.duration,
                iccid: data.iccid,
                matchingId: data.matchingId,
                smdpAddress: data.smdpAddress,
                baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://simfly.me',
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
                subject: `Deine eSIM für ${data.productName} ist bereit! 🌍`,
                html: emailHtml,
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[MAIL] Failed to send email via Resend:', errorText);
            return { success: false, error: 'Email delivery failed' };
        }

        const dataRes = await res.json();
        console.log(`[MAIL] Confirmation sent to ${data.customerEmail}. ID: ${dataRes.id}`);
        return { success: true, id: dataRes.id };

    } catch (error) {
        console.error('[MAIL] Error sending email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

export async function sendAdminAlert(subject: string, message: string, severity: 'info' | 'warning' | 'error' = 'warning') {
    console.log(`[MAIL] Sending admin alert: ${subject}`);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@simfly.me';

    try {
        // Render React Email template to HTML
        const emailHtml = await render(
            AdminAlertEmail({
                subject,
                message,
                severity,
            })
        );

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'Simfly System <onboarding@resend.dev>',
                to: adminEmail,
                subject: `[ALERT] ${subject}`,
                html: emailHtml,
            })
        });

        if (!res.ok) {
            console.error('[MAIL] Failed to send admin alert:', await res.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('[MAIL] Error sending admin alert:', error);
        return false;
    }
}