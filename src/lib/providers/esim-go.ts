
import { EsimProvider, NormalizedProduct, OrderResult } from './types';

export class EsimGoProvider implements EsimProvider {
    name = 'eSIM Go';
    slug = 'esim-go';
    private apiKey = process.env.ESIM_GO_API_KEY || '';
    private baseUrl = 'https://api.esim-go.com/v2.4';

    async checkHealth(): Promise<boolean> {
        if (!this.apiKey) return false;
        try {
            await this.getBalance();
            return true;
        } catch {
            return false;
        }
    }

    async getBalance(): Promise<number> {
        if (!this.apiKey) throw new Error('API Key missing');
        const res = await fetch(`https://api.esim-go.com/v2.2/balance`, { // v2.2 for balance
            headers: { 'X-API-Key': this.apiKey }
        });
        if (!res.ok) throw new Error(`Balance check failed: ${res.status}`);
        const data = await res.json();
        return data.balance || 0;
    }

    async fetchCatalog(): Promise<NormalizedProduct[]> {
        if (!this.apiKey) throw new Error('API Key missing');

        console.log('[ESIM-GO] Use v2.4 Catalogue API...');
        let allBundles: any[] = [];
        let page = 0;
        let totalPages = 1;
        const perPage = 1000;

        try {
            do {
                const res = await fetch(`${this.baseUrl}/catalogue?perPage=${perPage}&page=${page}`, {
                    headers: { 'X-API-Key': this.apiKey, 'Accept': 'application/json' }
                });

                if (!res.ok) throw new Error(`Fetch failed page ${page}: ${res.status}`);

                const data = await res.json();
                const bundles = data.bundles || [];
                allBundles = [...allBundles, ...bundles];

                if (data.totalPages) totalPages = data.totalPages;
                else if (bundles.length < perPage) totalPages = page + 1;
                else totalPages = page + 2; // Guessing

                page++;
            } while (page < totalPages);
        } catch (error) {
            console.error('[ESIM-GO] Catalog fetch error', error);
            throw error;
        }

        // Normalize
        return allBundles.filter(b => b.name && b.price > 0).map(b => {
            // Determine Country Code
            let countryCode = 'global';
            if (b.countries && b.countries.length === 1) {
                countryCode = b.countries[0].iso;
            } else if (b.countries && b.countries.length > 1) {
                // Check if it's a region
                if (b.groups && b.groups.length > 0) {
                    // Try to map group name to region code? For now use 'multi'
                    countryCode = 'multi';
                    // Or check if all countries belong to EU?
                } else {
                    countryCode = 'multi';
                }
            }

            // Determine Data Amount
            let dataMB = b.dataAmount || 0;
            let isUnlimited = false;
            if (b.name.toLowerCase().includes('unlimited')) {
                dataMB = -1;
                isUnlimited = true;
            }

            // Duration
            let days = 0;
            if (typeof b.duration === 'number') days = b.duration;
            else if (typeof b.duration === 'string') days = parseInt(b.duration) || 0;

            // Network Type (e.g. 5G)
            let networkType = '4G';
            if (b.name.includes('5G')) networkType = '5G';

            return {
                id: b.name,
                name: b.name,
                price: b.price,
                currency: b.currency || 'USD',
                countryCode,
                dataAmountMB: dataMB,
                validityDays: days,
                isUnlimited,
                networkType,
                originalData: b
            };
        });
    }

    async order(productId: string): Promise<OrderResult> {
        if (!this.apiKey) return { success: false, providerOrderReference: '', error: 'API Key missing' };

        const payload = {
            type: 'transaction',
            assign: true,
            Order: [{ type: 'bundle', quantity: 1, item: productId }]
        };

        try {
            const res = await fetch(`${this.baseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Order failed: ${txt}`);
            }

            const data = await res.json();
            if (data.order && data.order.length > 0) {
                const orderItem = data.order[0];
                return {
                    success: true,
                    providerOrderReference: data.orderReference, // Top level Ref?
                    esim: orderItem.esims && orderItem.esims.length > 0 ? {
                        iccid: orderItem.esims[0].iccid,
                        matchingId: orderItem.esims[0].matchingId,
                        smdpAddress: orderItem.esims[0].smdpAddress || 'rsp.esim-go.com',
                        qrCodeUrl: undefined // Generated locally usually
                    } : undefined
                };
            }
            throw new Error('No order items returned');
        } catch (error: any) {
            return {
                success: false,
                providerOrderReference: '',
                error: error.message
            };
        }
    }
}
