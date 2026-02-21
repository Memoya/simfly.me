import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Dynamic imports
        const { getSettings } = await import('@/lib/settings');
        const { getProvider } = await import('@/lib/providers');
        const { sendAdminAlert } = await import('@/lib/email');

        const settings = await getSettings();

        if (!settings.lowBalanceAlertEnabled) {
            return NextResponse.json({ message: 'Alerts disabled' });
        }

        const provider = getProvider('esim-access');
        if (!provider) {
            return NextResponse.json({ error: 'Provider not configured' }, { status: 500 });
        }

        const balance = await provider.getBalance();
        const currency = 'USD';
        const threshold = settings.lowBalanceThreshold || 50.0;

        if (balance < threshold) {
            console.log(`[CRON] Balance Low: ${balance} ${currency} < ${threshold}`);

            const alertSent = await sendAdminAlert(
                `Low Balance Warning: ${balance} ${currency}`,
                `Your eSIMAccess account balance is low. Current balance: <strong>${balance} ${currency}</strong>.<br>Threshold is set to ${threshold}.<br>Please top up immediately to avoid service interruption.`
            );

            if (alertSent) {
                return NextResponse.json({ message: 'Alert sent', balance });
            } else {
                return NextResponse.json({ error: 'Failed to send alert', balance }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'Balance OK', balance });

    } catch (error) {
        console.error('[CRON] Check balance failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
