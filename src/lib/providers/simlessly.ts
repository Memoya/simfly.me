
import { EsimProvider, NormalizedProduct, OrderResult } from './types';

export class SimlesslyProvider implements EsimProvider {
    name = 'Simlessly';
    slug = 'simlessly';
    private apiKey = process.env.SIMLESSLY_API_KEY || '';
    private baseUrl = 'https://api.simlessly.com/v1';

    async checkHealth(): Promise<boolean> {
        return !!this.apiKey;
    }

    async getBalance(): Promise<number> {
        return 0; // Placeholder
    }

    async fetchCatalog(): Promise<NormalizedProduct[]> {
        if (!this.apiKey) return [];
        return [];
    }

    async order(_productId: string): Promise<OrderResult> {
        return { success: false, providerOrderReference: '', error: 'API not implemented yet' };
    }
}
