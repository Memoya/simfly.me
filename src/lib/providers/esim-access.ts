import { NormalizedProduct, OrderResult, EsimProvider } from './types';
import * as crypto from 'crypto';

export class EsimAccessProvider implements EsimProvider {
    name = 'eSIMAccess';
    slug = 'esim-access';
    private accessCode = 'ddf262332cdd43b6b1a85ae56dc78261';
    private secretKey = '1e08f66c25f44cea93af1070a07a623c';
    public baseUrl = 'https://api.esimaccess.com/api/v1';

    // Disable manual overrides for this provider as requested
    set apiKey(_val: string) { }
    set config(_val: any) { }

    private generateSignature(timestamp: string, requestId: string, body: string): string {
        const signData = `${timestamp}${requestId}${this.accessCode}${body}`;
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(signData)
            .digest('hex');
    }

    private getHeaders(body: any = {}): Record<string, string> {
        const timestamp = Date.now().toString();
        const requestId = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        const bodyStr = JSON.stringify(body);
        const signature = this.generateSignature(timestamp, requestId, bodyStr);

        return {
            'Content-Type': 'application/json',
            'RT-AccessCode': this.accessCode,
            'RT-Signature': signature,
            'RT-Timestamp': timestamp,
            'RT-RequestID': requestId
        };
    }

    async checkHealth(): Promise<boolean> {
        try {
            console.log(`[eSIMAccess] Checking health (Balance) using ${this.baseUrl}...`);
            const balance = await this.getBalance();
            return balance >= 0;
        } catch (error) {
            console.error('[eSIMAccess] Health check exception:', error);
            return false;
        }
    }

    async getBalance(): Promise<number> {
        try {
            const body = {};
            const response = await fetch(`${this.baseUrl}/open/balance/query`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.error(`[eSIMAccess] Balance API error: ${response.status} ${response.statusText}`);
                return -1;
            }

            const data = await response.json();
            if (data.code === '0000' && data.data) {
                return parseFloat(data.data.balance || '0');
            }
            console.warn('[eSIMAccess] Balance query returned non-zero code:', data.code, data.message);
            return -1;
        } catch (error) {
            console.error('[eSIMAccess] Balance check failed:', error);
            return -1;
        }
    }

    async fetchCatalog(): Promise<NormalizedProduct[]> {
        try {
            const body = {};
            console.log(`[eSIMAccess] Fetching catalog from ${this.baseUrl} with AccessCode ${this.accessCode.substring(0, 4)}...`);
            const response = await fetch(`${this.baseUrl}/open/package/list`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.error(`[eSIMAccess] Catalog API error: ${response.status}`);
                return [];
            }

            const data = await response.json();
            if (data.code !== '0000' || !data.data || !Array.isArray(data.data.packageList)) {
                console.warn('[eSIMAccess] Catalog query failed or empty:', data.code, data.message);
                return [];
            }

            console.log(`[eSIMAccess] Successfully fetched ${data.data.packageList.length} packages`);

            return data.data.packageList.map((pkg: any) => {
                const volumeBytes = parseInt(pkg.volume || '0');
                const dataAmountMB = pkg.volume === '-1' ? -1 : Math.floor(volumeBytes / 1048576);

                return {
                    id: pkg.packageCode || pkg.slug,
                    name: pkg.packageName || pkg.name,
                    price: parseFloat(pkg.price || '0'),
                    currency: pkg.currency || 'USD',
                    countryCode: pkg.locationCode || 'global',
                    dataAmountMB,
                    validityDays: parseInt(pkg.duration || '0'),
                    isUnlimited: pkg.volume === '-1',
                    networkType: 'LTE/5G',
                    originalData: pkg
                };
            });
        } catch (error) {
            console.error('[eSIMAccess] Catalog fetch failed:', error);
            return [];
        }
    }

    async order(productId: string): Promise<OrderResult> {
        return this.placeOrder({ packageCode: productId, count: 1 });
    }

    async topUp(iccid: string, productId: string): Promise<OrderResult> {
        return this.placeOrder({ packageCode: productId, iccid, count: 1 });
    }

    private async placeOrder(orderData: any): Promise<OrderResult> {
        try {
            const transactionId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const body = {
                transactionId,
                ...orderData
            };

            const response = await fetch(`${this.baseUrl}/open/order/profiles`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                return { success: false, providerOrderReference: '', error: `HTTP ${response.status}` };
            }

            const data = await response.json();

            if (data.code === '0000' && data.data) {
                const orderInfo = data.data;
                const esim = orderInfo.esimList?.[0] || orderInfo.orderList?.[0];

                if (esim && esim.iccid) {
                    return {
                        success: true,
                        providerOrderReference: orderInfo.orderNo || transactionId,
                        esim: {
                            iccid: esim.iccid,
                            smdpAddress: esim.smdpAddress || '',
                            matchingId: esim.matchingId || esim.activationCode || ''
                        }
                    };
                }

                return {
                    success: true,
                    providerOrderReference: orderInfo.orderNo || transactionId,
                    error: 'Order accepted, async allocation pending'
                };
            }

            return {
                success: false,
                providerOrderReference: '',
                error: data.errorMsg || data.message || 'Unknown provider error'
            };

        } catch (error: any) {
            console.error('[eSIMAccess] Order failed:', error);
            return { success: false, providerOrderReference: '', error: error.message };
        }
    }

    async getEsimDetails(iccid: string): Promise<any> {
        try {
            const body = { iccid };
            const response = await fetch(`${this.baseUrl}/open/esim/query`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.code === '0000' ? data.data : null;
        } catch (error) {
            console.error('[eSIMAccess] Query eSIM details failed:', error);
            return null;
        }
    }

    async getUsage(iccid: string): Promise<any> {
        try {
            const body = { iccid };
            const response = await fetch(`${this.baseUrl}/open/usage/query`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.code === '0000' ? data.data : null;
        } catch (error) {
            console.error('[eSIMAccess] Query usage failed:', error);
            return null;
        }
    }

    async reDownload(iccid: string): Promise<any> {
        try {
            const body = { iccid };
            const response = await fetch(`${this.baseUrl}/open/esim/re-download`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[eSIMAccess] Re-download failed:', error);
            return null;
        }
    }

    async getInstallLog(iccid: string): Promise<any> {
        try {
            const body = { iccid };
            const response = await fetch(`${this.baseUrl}/open/esim/install/log`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[eSIMAccess] Get install log failed:', error);
            return null;
        }
    }
}
