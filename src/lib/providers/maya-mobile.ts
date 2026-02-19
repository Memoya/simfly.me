
import { EsimProvider, NormalizedProduct, OrderResult } from './types';

export class MayaMobileProvider implements EsimProvider {
    name = 'Maya Mobile';
    slug = 'maya-mobile';
    private apiKey = process.env.MAYA_MOBILE_API_KEY || '';

    async checkHealth(): Promise<boolean> {
        return !!this.apiKey;
    }

    async getBalance(): Promise<number> {
        return 0; // Placeholder
    }

    async fetchCatalog(): Promise<NormalizedProduct[]> {
        return [];
    }

    async order(_productId: string): Promise<OrderResult> {
        return { success: false, providerOrderReference: '', error: 'API not implemented yet' };
    }
}
