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
    iccid?: string;
    matchingId?: string;
    smdpAddress?: string;
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
                subject: `[V7] Deine eSIM für ${data.productName} ist bereit! 🌍`,
                html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #1a1a1a;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">SIMFLY<span style="color: #0066FF;">.ME</span></h1>
                    </div>

                    <div style="background: #ffffff; border-radius: 24px; padding: 30px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 30px; border: 1px solid #f0f0f0;">
                        <h2 style="margin: 0 0 15px 0; font-size: 20px;">Gute Reise! ✈️</h2>
                        <p style="margin: 0 0 20px 0; line-height: 1.6; color: #666;">
                            Vielen Dank für deine Bestellung. Deine eSIM ist bereit zur Aktivierung. Nutze eine der folgenden Methoden:
                        </p>

                        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff; border: 1px dashed #ddd; border-radius: 16px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$${data.smdpAddress || 'rsp.esim-go.com'}$${data.matchingId || 'ERROR'}" alt="eSIM QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
                            <p style="font-size: 13px; color: #999; margin-top: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Methode 1: QR-Code scannen</p>
                            <p style="font-size: 12px; color: #666; margin-top: 5px;">In den Einstellungen unter "Mobilfunk" > "eSIM hinzufügen"</p>
                        </div>

                        ${data.matchingId && data.smdpAddress ? `
                        <div style="margin: 30px 0; padding: 25px; background: #f0f7ff; border-radius: 16px; border: 1px solid #e0eeff;">
                            <div style="margin-bottom: 25px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #0066FF; letter-spacing: 1px;">Methode 2: Direkt-Aktivierung (iOS)</h3>
                                <p style="margin: 0 0 15px 0; font-size: 13px; color: #444;">Nur für iPhones: Klicke auf den Button, um das eSIM-Menü direkt zu öffnen.</p>
                                <a href="apple-esim://install?address=${data.smdpAddress}&matchingId=${data.matchingId}" style="display: block; background: #000; color: #fff; text-decoration: none; padding: 16px 20px; border-radius: 12px; font-size: 14px; font-weight: 900; text-align: center; letter-spacing: 0.5px;">JETZT AUF iPHONE INSTALLIEREN</a>
                            </div>

                            <div style="border-top: 1px solid #e0eeff; padding-top: 20px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #0066FF; letter-spacing: 1px;">Methode 3: Manuelle Eingabe</h3>
                                <p style="margin: 0 0 15px 0; font-size: 13px; color: #444;">Falls Methode 1 & 2 nicht funktionieren (z.B. Android), gib diese Daten manuell ein:</p>
                                
                                <div style="margin-bottom: 12px;">
                                    <span style="display: block; font-size: 9px; text-transform: uppercase; color: #999; font-weight: bold; margin-bottom: 4px;">SM-DP+ Adresse</span>
                                    <code style="display: block; background: #fff; padding: 12px; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 13px; border: 1px solid #dce8f5; color: #0066FF; word-break: break-all;">${data.smdpAddress}</code>
                                </div>
                                
                                <div>
                                    <span style="display: block; font-size: 9px; text-transform: uppercase; color: #999; font-weight: bold; margin-bottom: 4px;">Aktivierungscode</span>
                                    <code style="display: block; background: #fff; padding: 12px; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 13px; border: 1px solid #dce8f5; color: #0066FF; word-break: break-all;">${data.matchingId}</code>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #eee;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #666; font-size: 13px;">Region / Paket</td>
                                    <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #000; font-size: 13px;">${data.productName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #666; font-size: 13px;">Datenvolumen</td>
                                    <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #000; font-size: 13px;">${data.dataAmount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #666; font-size: 13px;">Laufzeit</td>
                                    <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #000; font-size: 13px;">${data.duration}</td>
                                </tr>
                                ${data.iccid ? `
                                <tr>
                                    <td style="padding: 6px 0; color: #666; font-size: 13px;">Individuelle ICCID</td>
                                    <td style="padding: 6px 0; font-weight: 800; text-align: right; font-family: monospace; color: #0066FF; font-size: 13px;">${data.iccid}</td>
                                </tr>
                                ` : ''}
                            </table>
                        </div>

                        <div style="margin-top: 30px; text-align: center;">
                            <a href="https://simfly.me/check" style="display: inline-block; background: #0066FF; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 900; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,102,255,0.2);">DATENVOLUMEN PRÜFEN</a>
                        </div>
                    </div>

                    <div style="text-align: center; font-size: 11px; color: #999;">
                        <p style="margin-bottom: 15px; font-weight: bold; color: #666;">Simfly.me - Premium Global eSIM</p>
                        <p style="font-size: 10px; color: #ccc;">
                            Bestell-Ref: ${data.orderId} | V7 | Status: Verified
                        </p>
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