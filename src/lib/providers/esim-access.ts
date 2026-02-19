import { NormalizedProduct, OrderResult, EsimProvider } from './types';
import * as crypto from 'crypto';

export class EsimAccessProvider implements EsimProvider {
    name = 'eSIMAccess';
    slug = 'esim-access';
    private accessCode = process.env.ESIM_ACCESS_CODE || 'ddf262332cdd43b6b1a85ae56dc78261';
    private secretKey = process.env.ESIM_ACCESS_SECRET || '1e08f66c25f44cea93af1070a07a623c';
    public baseUrl = 'https://api.esimaccess.com/api/v1';

    // Disable manual overrides for this provider as requested
    set apiKey(_val: string) { }
    set config(_val: any) { }

    private generateSignature(timestamp: string, requestId: string, body: string): string {
        // Redtea specs: Timestamp + RequestID + AccessCode + Body
        const signData = `${timestamp}${requestId}${this.accessCode}${body}`;
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(signData)
            .digest('hex')
            .toLowerCase(); // Redtea specs usually use lowercase hex
    }

    private getHeaders(body: any = null): Record<string, string> {
        const timestamp = Date.now().toString();
        // Some Redtea versions prefer 32-char hex (no dashes)
        const requestId = crypto.randomUUID().replace(/-/g, '');

        // Sign the EXACT string that will be sent in the fetch body
        const bodyStr = body ? JSON.stringify(body) : "";
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
            const balance = await this.getBalance();
            return balance >= 0;
        } catch (error) {
            console.error('[eSIMAccess] Health check exception:', error);
            return false;
        }
    }

    async getBalance(): Promise<number> {
        try {
            const body = {}; // Most Redtea endpoints expect {} even if no params
            const response = await fetch(`${this.baseUrl}/open/balance/query`, {
                method: 'POST',
                headers: this.getHeaders(body),
                body: JSON.stringify(body)
            });

            const data = await response.json();
            const inner = data.obj || data.data;
            if ((data.success || data.code === '0000' || data.errorCode === '0') && inner) {
                const rawBalance = parseFloat(inner.balance || '0');
                // Factor 10,000 applies to balance as well
                return rawBalance / 10000;
            }
            console.error('[eSIMAccess] Balance Response Info:', data.code || data.errorCode, data.message || data.errorMsg);
            return -1;
        } catch (error) {
            console.error('[eSIMAccess] Balance check failed:', error);
            return -1;
        }
    }

    async fetchCatalog(): Promise<NormalizedProduct[]> {
        // Redtea often requires an empty body or specific paging for the package list
        const endpoints = [
            {
                url: `${this.baseUrl}/open/package/list`,
                body: {}
            }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint.url, {
                    method: 'POST',
                    headers: this.getHeaders(endpoint.body),
                    body: JSON.stringify(endpoint.body)
                });

                if (!response.ok) continue;

                const data = await response.json();

                // Extra defensive mapping: check every possible field name for the package list
                // User guide specifies data.obj.packageList
                const list = data.obj?.packageList || data.data?.packageList || data.packageList || data.data?.list || data.data?.packages || data.packages;

                if ((data.success || data.code === '0000') && Array.isArray(list) && list.length > 0) {
                    console.log(`[eSIMAccess] Found ${list.length} packages at ${endpoint.url}`);
                    return this.mapPackages(list);
                } else {
                    console.warn(`[eSIMAccess] ${endpoint.url} returned 0 results. Success: ${data.success}, Code: ${data.code}, Msg: ${data.message || data.errorMsg}`);
                }
            } catch (err) {
                console.error(`[eSIMAccess] Endpoint ${endpoint.url} error:`, err);
            }
        }

        return [];
    }

    private mapPackages(packageList: any[]): NormalizedProduct[] {
        return packageList.map((pkg: any) => {
            // Support both string and number prices
            // User guide says price is factor 10,000 (10000 = 1.00 USD)
            const rawPrice = typeof pkg.price === 'string' ? parseFloat(pkg.price) : (pkg.price || 0);
            const price = rawPrice / 10000;

            // Volume can be bytes or megabytes depending on the provider sub-configuration
            const vol = parseInt(pkg.volume || '0');
            let dataAmountMB = pkg.volume === '-1' || pkg.volume === -1 ? -1 : vol;
            if (dataAmountMB > 100000) dataAmountMB = Math.floor(dataAmountMB / 1048576);

            return {
                id: pkg.slug || pkg.packageCode || pkg.id,
                name: pkg.name || pkg.packageName || pkg.packageCode,
                price: price,
                currency: pkg.currencyCode || pkg.currency || 'USD',
                countryCode: pkg.locationCode || pkg.location || 'global',
                dataAmountMB,
                validityDays: parseInt(pkg.duration || '0'),
                isUnlimited: pkg.volume === '-1' || pkg.volume === -1,
                networkType: pkg.speed || pkg.networkType || '4G/5G',
                originalData: pkg
            };
        });
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
            const inner = data.obj || data.data;

            if ((data.success || data.code === '0000' || data.errorCode === '0') && inner) {
                const orderInfo = inner;
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
            return (data.success || data.code === '0000' || data.errorCode === '0') ? (data.obj || data.data) : null;
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
            return (data.success || data.code === '0000' || data.errorCode === '0') ? (data.obj || data.data) : null;
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
