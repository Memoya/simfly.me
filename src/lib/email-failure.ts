/**
 * Failure Notification Email
 */

export interface FailureNotificationData {
    customerEmail: string;
    orderId: string;
    productName: string;
    error?: string;
}

export async function sendFailureNotification(data: FailureNotificationData) {
    console.log(`[MAIL] Sending failure notification to ${data.customerEmail}`);

    try {
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
                html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #1a1a1a;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">SIMFLY<span style="color: #0066FF;">.ME</span></h1>
                    </div>

                    <div style="background: #ffffff; border-radius: 24px; padding: 30px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 30px; border: 1px solid #f0f0f0;">
                        <h2 style="margin: 0 0 15px 0; font-size: 20px;">Vielen Dank für deine Bestellung! 🙏</h2>
                        <p style="margin: 0 0 20px 0; line-height: 1.6; color: #666;">
                            Deine Zahlung wurde erfolgreich erhalten. Wir bereiten gerade deine eSIM vor.
                        </p>

                        <div style="background: #fff7e6; border-radius: 12px; padding: 20px; border: 1px solid #ffd28a; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #b36b00; font-weight: bold;">
                                ⏳ Deine eSIM wird aktuell aktiviert
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 13px; color: #7a4a00;">
                                Du erhältst in wenigen Minuten eine weitere Email mit deinem QR-Code und den Aktivierungsdaten.
                            </p>
                        </div>

                        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #eee;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #666; font-size: 13px;">Bestellung</td>
                                    <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #000; font-size: 13px;">${data.productName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #666; font-size: 13px;">Referenz</td>
                                    <td style="padding: 6px 0; font-weight: 800; text-align: right; font-family: monospace; color: #0066FF; font-size: 11px;">${data.orderId.substring(0, 20)}...</td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin-top: 30px; text-align: center;">
                            <p style="font-size: 12px; color: #999;">
                                Falls du nach 30 Minuten keine weitere Email erhältst, kontaktiere uns bitte unter <a href="mailto:support@simfly.me" style="color: #0066FF; text-decoration: none;">support@simfly.me</a>
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; font-size: 11px; color: #999;">
                        <p style="margin-bottom: 15px; font-weight: bold; color: #666;">Simfly.me - Premium Global eSIM</p>
                    </div>
                </div>
            `
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
