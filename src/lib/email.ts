/**
 * Email Utility for Simfly.me
 * This utility handles sending eSIM QR codes and order confirmations.
 * In Production: Connect to Resend, SendGrid, or AWS SES.
 */

export interface OrderEmailData {
    customerEmail: string;
    orderId: string;
    productName: string;
    qrCodeUrl: string; // URL from eSIM Go
    dataAmount: string;
    duration: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
    console.log(`[MAIL] Preparing to send order confirmation to ${data.customerEmail}`);

    // Integration logic for Resend
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Simfly <bestellung@simfly.me>',
                to: data.customerEmail,
                subject: `Deine eSIM für ${data.productName} ist bereit! 🌍`,
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #1a1a1a;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">SIMFLY<span style="color: #0066FF;">.ME</span></h1>
                    </div>

                    <div style="background: #ffffff; border-radius: 24px; padding: 30px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 30px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 20px;">Gute Reise! ✈️</h2>
                        <p style="margin: 0 0 20px 0; line-height: 1.6; color: #666;">
                            Vielen Dank für deine Bestellung. Deine eSIM ist bereit zur Aktivierung.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <img src="${data.qrCodeUrl}" alt="eSIM QR Code" style="width: 200px; height: 200px; border-radius: 12px; border: 1px solid #eee;" />
                            <p style="font-size: 14px; color: #999; margin-top: 10px;">Scanne diesen Code in den Einstellungen<br>unter "Mobilfunk" > "eSIM hinzufügen"</p>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 5px 0; color: #666; font-size: 14px;">Datenvolumen</td>
                                    <td style="padding: 5px 0; font-weight: bold; text-align: right;">${data.dataAmount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #666; font-size: 14px;">Laufzeit</td>
                                    <td style="padding: 5px 0; font-weight: bold; text-align: right;">${data.duration}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #666; font-size: 14px;">Region/Land</td>
                                    <td style="padding: 5px 0; font-weight: bold; text-align: right;">${data.productName}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div style="text-align: center; font-size: 12px; color: #999;">
                        <p>Simfly.me - Premium eSIM Solutions<br>Berlin, Germany</p>
                    </div>
                </div>
            `
            })
        });

        if (!res.ok) {
            const error = await res.text();
            console.error('[MAIL] Failed to send email via Resend:', error);
            return { success: false, error };
        }

        const dataRes = await res.json();
        console.log(`[MAIL] Confirmation sent to ${data.customerEmail}. ID: ${dataRes.id}`);
        return { success: true, id: dataRes.id };

    } catch (error) {
        console.error('[MAIL] Error sending email:', error);
        return { success: false, error };
    }
}

export async function sendAdminAlert(subject: string, message: string) {
    console.log(`[MAIL] Sending admin alert: ${subject}`);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@simfly.me';

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Simfly System <system@simfly.me>',
                to: adminEmail,
                subject: `[ALERT] ${subject}`,
                html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #d9534f;">⚠️ System Alert</h2>
                    <p>${message}</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">Time: ${new Date().toISOString()}</p>
                </div>
                `
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
