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

export interface EsimDetails {
    iccid: string;
    status: string; // 'enabled', 'disabled', 'released', 'deleted'
    currenctBundle?: string;
    bundles: {
        name: string;
        status: string; // 'active', 'queued', 'expired', 'completed'
        initialQuantity: number;
        remainingQuantity: number;
        startTime?: string;
        endTime?: string;
    }[];
}

export async function createOrder(bundleName: string): Promise<EsimOrderResult> {
    if (!API_KEY) return { success: false, error: 'ESIM_GO_API_KEY is not configured' };

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
    if (!API_KEY) throw new Error('ESIM_GO_API_KEY is not configured');

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

export async function getEsimDetails(iccid: string): Promise<EsimDetails | null> {
    if (!API_KEY) { console.error('ESIM_GO_API_KEY missing'); return null; }

    try {
        const res = await fetch(`${BASE_URL}/esims/${iccid}/bundles`, {
            headers: { 'X-API-Key': API_KEY }
        });

        const statusRes = await fetch(`${BASE_URL}/esims/${iccid}`, {
            headers: { 'X-API-Key': API_KEY }
        });

        if (!res.ok) return null;

        const bundlesData = await res.json();
        const statusData = await statusRes.json();

        const bundles = (bundlesData.bundles || []).map((b: any) => ({
            name: b.name,
            status: b.assignments?.[0]?.status || 'unknown',
            initialQuantity: b.assignments?.[0]?.initialQuantity || 0,
            remainingQuantity: b.assignments?.[0]?.remainingQuantity || 0,
            startTime: b.assignments?.[0]?.startTime,
            endTime: b.assignments?.[0]?.endTime,
        }));

        return {
            iccid,
            status: statusData.status || 'unknown',
            bundles
        };

    } catch (error) {
        console.error('[ESIM] Failed to get details:', error);
        return null;
    }
}

export async function applyBundle(iccid: string, bundleName: string): Promise<{ success: boolean; error?: string }> {
    if (!API_KEY) return { success: false, error: 'ESIM_GO_API_KEY missing' };

    try {
        const res = await fetch(`${BASE_URL}/esims/${iccid}/bundles`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: bundleName })
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt);
        }

        return { success: true };
    } catch (error: any) {
        console.error('[ESIM] Apply bundle failed:', error);
        return { success: false, error: error.message };
    }
}

// --- v2.4 Order Management for Admin ---

const API_V2_4 = 'https://api.esim-go.com/v2.4';

export async function listEsimOrders(page = 0, perPage = 20): Promise<{ orders: any[], totalPages: number, totalRecords: number }> {
    if (!API_KEY) return { orders: [], totalPages: 0, totalRecords: 0 };

    try {
        const res = await fetch(`${API_V2_4}/orders?page=${page}&perPage=${perPage}`, {
            headers: { 'X-API-Key': API_KEY }
        });

        if (!res.ok) throw new Error(`Failed to list orders: ${res.status}`);

        const data = await res.json();
        return {
            orders: data.orders || [],
            totalPages: data.totalPages || 0,
            totalRecords: data.totalRecords || 0
        };
    } catch (error) {
        console.error('[ESIM] List orders failed:', error);
        return { orders: [], totalPages: 0, totalRecords: 0 };
    }
}

export async function getEsimOrder(reference: string): Promise<any | null> {
    if (!API_KEY) return null;

    try {
        const res = await fetch(`${API_V2_4}/orders/${reference}`, {
            headers: { 'X-API-Key': API_KEY }
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('[ESIM] Get order details failed:', error);
        return null;
    }
}

export async function createAdminOrder(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!API_KEY) return { success: false, error: 'ESIM_GO_API_KEY missing' };

    try {
        const res = await fetch(`${API_V2_4}/orders`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt);
        }

        const data = await res.json();
        return { success: true, data };
    } catch (error: any) {
        console.error('[ESIM] Create admin order failed:', error);
        return { success: false, error: error.message };
    }
}


