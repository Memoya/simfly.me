
const API_KEY = process.env.ESIM_GO_API_KEY;
const BASE_URL = 'https://api.esim-go.com/v2.2'; // Using v2.2 as seen in balance check

export interface EsimOrderResult {
    success: boolean;
    iccid?: string;
    matchingId?: string;
    smdpAddress?: string;
    qrCodeUrl?: string;
    error?: string;
}

export async function createOrder(bundleName: string): Promise<EsimOrderResult> {
    if (!API_KEY || API_KEY === 'mock_esim_key') {
        console.warn('[ESIM] Using Mock Mode (No API Key)');
        return {
            success: true,
            iccid: '89000000000000000000',
            matchingId: 'TEST-MATCHING-ID',
            smdpAddress: 'rsp.esim-go.com',
            qrCodeUrl: 'https://chart.googleapis.com/chart?cht=qr&chl=LPA:1$rsp.esim-go.com$TEST-MATCHING-ID&chs=200x200'
        };
    }

    try {
        const payload = {
            type: 'transaction',
            assign: true,
            Order: [
                {
                    type: 'bundle',
                    quantity: 1,
                    item: bundleName
                }
            ]
        };

        const res = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Error ${res.status}: ${errText}`);
        }

        const data = await res.json();

        if (data.inventory && data.inventory.length > 0) {
            const item = data.inventory[0];
            const matchingId = item.matchingId;
            const smdpAddress = item.smdpAddress || 'rsp.esim-go.com';
            const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=LPA:1$${smdpAddress}$${matchingId}&chs=200x200`;

            return {
                success: true,
                iccid: item.iccid,
                matchingId: matchingId,
                smdpAddress: smdpAddress,
                qrCodeUrl: qrCodeUrl
            };
        } else {
            throw new Error('No inventory returned in order response');
        }

    } catch (error) {
        console.error('[ESIM] Order creation failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getAccountBalance(): Promise<{ balance: number; currency: string }> {
    if (!API_KEY || API_KEY === 'mock_esim_key') {
        return { balance: 250.00, currency: 'USD' };
    }

    try {
        const res = await fetch(`${BASE_URL}/balance`, {
            headers: { 'X-API-Key': API_KEY }
        });

        if (!res.ok) throw new Error('Failed to fetch balance');

        const data = await res.json();
        return {
            balance: data.balance || 0,
            currency: data.currency || 'USD'
        };
    } catch (error) {
        console.error('[ESIM] Failed to fetch balance:', error);
        throw error;
    }
}
