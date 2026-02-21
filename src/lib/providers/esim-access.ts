import { NormalizedProduct, OrderResult, EsimProvider } from './types';
import * as crypto from 'crypto';

export class EsimAccessProvider implements EsimProvider {
    name = 'eSIMAccess';
    slug = 'esim-access';
    private accessCode = process.env.ESIM_ACCESS_CODE || '';
    private secretKey = process.env.ESIM_ACCESS_SECRET || '';
    public baseUrl = 'https://api.esimaccess.com/api/v1';
    private isTestMode = process.env.ESIM_ACCESS_TEST_MODE === 'true';
    private lastDebug: { keys: string[]; sample: Record<string, any> } | null = null;

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
                const configuredDivisor = Number(process.env.ESIM_ACCESS_BALANCE_DIVISOR || 10000);
                const divisor = Number.isFinite(configuredDivisor) && configuredDivisor > 0 ? configuredDivisor : 10000;
                // Default divisor is 10000, override with ESIM_ACCESS_BALANCE_DIVISOR if needed.
                return rawBalance / divisor;
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
                    if (process.env.ESIM_ACCESS_DEBUG === 'true') {
                        const sample = list[0];
                        const sampleKeys = sample && typeof sample === 'object' ? Object.keys(sample) : [];
                        this.lastDebug = {
                            keys: sampleKeys,
                            sample: {
                                id: sample?.id,
                                packageCode: sample?.packageCode,
                                slug: sample?.slug,
                                name: sample?.name || sample?.packageName,
                                locationCode: sample?.locationCode,
                                location: sample?.location,
                                regionType: sample?.regionType || sample?.region_type,
                                dataType: sample?.dataType || sample?.data_type,
                                billingStarts: sample?.billingStarts || sample?.billingStart,
                                topUpType: sample?.topUpType || sample?.topupType || sample?.top_up_type,
                                validity: sample?.validity,
                                duration: sample?.duration,
                                breakoutIp: sample?.breakoutIp || sample?.breakoutIP,
                                resaleable: sample?.isResaleable ?? sample?.resaleable ?? sample?.rechargeable
                            }
                        };
                        console.log('[eSIMAccess] Sample package keys:', sampleKeys);
                        console.log('[eSIMAccess] Sample package (partial):', {
                            id: sample?.id,
                            packageCode: sample?.packageCode,
                            slug: sample?.slug,
                            name: sample?.name || sample?.packageName,
                            locationCode: sample?.locationCode,
                            location: sample?.location,
                            regionType: sample?.regionType || sample?.region_type,
                            dataType: sample?.dataType || sample?.data_type,
                            billingStarts: sample?.billingStarts || sample?.billingStart,
                            topUpType: sample?.topUpType || sample?.topupType || sample?.top_up_type,
                            validity: sample?.validity,
                            duration: sample?.duration,
                            breakoutIp: sample?.breakoutIp || sample?.breakoutIP,
                            resaleable: sample?.isResaleable ?? sample?.resaleable ?? sample?.rechargeable
                        });
                    }
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

    getDebugSnapshot() {
        return this.lastDebug;
    }

    private mapPackages(packageList: any[]): NormalizedProduct[] {
        return packageList.map((pkg: any) => {
            // Support both string and number prices
            // User guide says price is factor 10,000 (10000 = 1.00 USD)
            const rawPrice = typeof pkg.price === 'string' ? parseFloat(pkg.price) : (pkg.price || 0);
            const price = rawPrice / 10000;

            const normalizeString = (value: any): string | undefined => {
                if (typeof value === 'string') return value.trim();
                return undefined;
            };

            const toBoolean = (value: any): boolean | undefined => {
                if (typeof value === 'boolean') return value;
                if (typeof value === 'number') return value === 1;
                if (typeof value === 'string') {
                    const v = value.trim().toLowerCase();
                    if (['true', '1', 'yes', 'y'].includes(v)) return true;
                    if (['false', '0', 'no', 'n'].includes(v)) return false;
                }
                return undefined;
            };

            // Volume can be bytes or megabytes depending on the provider sub-configuration
            const vol = parseInt(pkg.volume || '0');
            let dataAmountMB = pkg.volume === '-1' || pkg.volume === -1 ? -1 : vol;
            if (dataAmountMB > 100000) dataAmountMB = Math.floor(dataAmountMB / 1048576);

            // Normalize country code: Extract first 2 letters (US from USCA-2, DE from DE-1, etc.)
            let countryCode = pkg.locationCode || pkg.location || 'global';
            if (countryCode && countryCode !== 'global') {
                // Extract only the first 2 characters if the code is longer (handles USCA-2 -> US, etc.)
                const match = countryCode.match(/^([A-Z]{2})/);
                if (match) {
                    countryCode = match[1];
                }
            }

            const dataTypeMap: Record<string, string> = {
                '0': 'Unknown',
                '1': 'Data in Total',
                '2': 'Daily',
                '3': 'Unlimited',
            };

            const activeTypeMap: Record<string, string> = {
                '1': 'On purchase',
                '2': 'First connection',
            };

            const topUpMap: Record<string, string> = {
                '0': 'Not supported',
                '1': 'Supported',
                '2': 'Supported',
            };

            const dataTypeRaw = pkg.dataType ?? pkg.data_type;
            const dataType = typeof dataTypeRaw === 'number' || typeof dataTypeRaw === 'string'
                ? (dataTypeMap[String(dataTypeRaw)] || String(dataTypeRaw))
                : normalizeString(dataTypeRaw);

            const topUpRaw = pkg.supportTopUpType ?? pkg.topUpType ?? pkg.topupType ?? pkg.top_up_type;
            const topUpType = typeof topUpRaw === 'number' || typeof topUpRaw === 'string'
                ? (topUpMap[String(topUpRaw)] || String(topUpRaw))
                : normalizeString(topUpRaw);

            const breakoutIp = normalizeString(pkg.ipExport || pkg.breakoutIp || pkg.breakoutIP || pkg.breakout || pkg.breakoutCountry);

            const rawPlanValidity = pkg.unusedValidTime ?? pkg.validity ?? pkg.validityDays ?? pkg.validityDay ?? pkg.validityPeriod ?? pkg.validityPeriodDays;
            const planValidityDays = rawPlanValidity !== undefined && rawPlanValidity !== null
                ? parseInt(String(rawPlanValidity), 10)
                : undefined;

            const billingStartsRaw = pkg.activeType ?? pkg.billingStarts ?? pkg.billingStart ?? pkg.billingType ?? pkg.billing_type;
            const billingStarts = typeof billingStartsRaw === 'number' || typeof billingStartsRaw === 'string'
                ? (activeTypeMap[String(billingStartsRaw)] || String(billingStartsRaw))
                : normalizeString(billingStartsRaw);

            const regionType = Array.isArray(pkg.locationNetworkList)
                ? (pkg.locationNetworkList.length > 1 ? 'Multi' : 'Single')
                : normalizeString(pkg.regionType || pkg.region_type || pkg.regionTypeName || pkg.regionTypeDesc);

            const isResaleable = toBoolean(pkg.isResaleable ?? pkg.resaleable ?? pkg.rechargeable ?? pkg.isRechargeable ?? pkg.topUpEnable ?? pkg.topUpAllowed ?? (typeof topUpRaw === 'number' ? topUpRaw > 0 : undefined));

            return {
                id: pkg.slug || pkg.packageCode || pkg.id,
                name: pkg.name || pkg.packageName || pkg.packageCode,
                price: price,
                currency: pkg.currencyCode || pkg.currency || 'USD',
                countryCode,
                dataAmountMB,
                validityDays: parseInt(pkg.duration || '0'),
                isUnlimited: pkg.volume === '-1' || pkg.volume === -1,
                networkType: pkg.speed || pkg.networkType || '4G/5G',
                regionType,
                dataType,
                billingStarts,
                topUpType,
                planValidityDays,
                breakoutIp,
                isResaleable,
                originalData: pkg
            };
        });
    }

    async order(productId: string): Promise<OrderResult> {
        if (this.isTestMode) {
            return {
                success: true,
                providerOrderReference: `TEST-${Date.now()}`,
                esim: {
                    iccid: `TESTICCID${Math.floor(Math.random() * 1000000)}`,
                    smdpAddress: 'smdp.esimaccess.test',
                    matchingId: `TEST-${Math.random().toString(36).slice(2, 10)}`,
                }
            };
        }

        return this.placeOrder({ packageCode: productId, count: 1 });
    }

    async topUp(iccid: string, productId: string): Promise<OrderResult> {
        if (this.isTestMode) {
            return {
                success: true,
                providerOrderReference: `TEST-TOPUP-${Date.now()}`,
                esim: {
                    iccid,
                    smdpAddress: 'smdp.esimaccess.test',
                    matchingId: `TEST-${Math.random().toString(36).slice(2, 10)}`,
                }
            };
        }

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
