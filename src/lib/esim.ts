import QRCode from 'qrcode';

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
    const isTestMode = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

    if (isTestMode || !API_KEY || API_KEY === 'mock_esim_key') {
        console.warn(`[ESIM] Simulation Mode Active (Stripe Test Key Detected: ${isTestMode}). Returning Mock Global eSIM.`);

        // Generate a real QR code for the fake data so it looks correct in the email
        const qrData = 'LPA:1$rsp.esim-go.com$TEST-MATCHING-ID-12345';
        const qrCodeUrl = await QRCode.toDataURL(qrData);

        return {
            success: true,
            iccid: '89852000000000000000', // Fake ICCID
            matchingId: 'TEST-MATCHING-ID-12345',
            smdpAddress: 'rsp.esim-go.com',
            qrCodeUrl: qrCodeUrl
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

        if (data.order && data.order.length > 0) {
            const orderItem = data.order[0];
            const esim = orderItem.esims && orderItem.esims.length > 0 ? orderItem.esims[0] : null;

            if (esim) {
                const iccid = esim.iccid;
                const matchingId = esim.matchingId;
                const smdpAddress = esim.smdpAddress || 'rsp.esim-go.com';

                const qrData = `LPA:1$${smdpAddress}$${matchingId}`;
                // Generate QR code locally as Data URI
                const qrCodeUrl = await QRCode.toDataURL(qrData);

                return {
                    success: true,
                    iccid: iccid,
                    matchingId: matchingId,
                    smdpAddress: smdpAddress,
                    qrCodeUrl: qrCodeUrl
                };
            } else {
                throw new Error('Order succeeded but no eSIM profile was assigned. Check if "assign:true" was passed.');
            }
        } else {
            throw new Error('No order details returned in response');
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
