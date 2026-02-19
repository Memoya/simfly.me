
import { EsimProvider, NormalizedProduct, OrderResult } from './types';

export class YesimProvider implements EsimProvider {
    name = 'Yesim.app';
    slug = 'yesim';
    private partnerId = ''; // From partner= param
    private accessCode = ''; // From RT-AccessCode header

    async checkHealth(): Promise<boolean> {
        return !!this.accessCode;
    }

    async getBalance(): Promise<number> {
        return 0;
    }

    async fetchCatalog(): Promise<NormalizedProduct[]> {
        if (!this.accessCode) return [];
        // Implementation for Yesim partner API would go here
        return [];
    }

    async order(_productId: string): Promise<OrderResult> {
        return { success: false, providerOrderReference: '', error: 'API not implemented yet' };
    }
}
