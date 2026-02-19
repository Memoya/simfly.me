
export interface NormalizedProduct {
    id: string; // Unique ID within provider context (e.g. bundle name)
    name: string;
    price: number;
    currency: string;

    // Normalized Data
    countryCode: string; // ISO 3166-1 alpha-2 (e.g. "US", "DE") or "global"
    dataAmountMB: number; // -1 for Unlimited
    validityDays: number;
    isUnlimited: boolean;
    networkType?: string; // e.g. "5G"

    originalData: any; // Raw provider data for debugging
}

export interface OrderResult {
    success: boolean;
    providerOrderReference: string;
    esim?: {
        iccid: string;
        smdpAddress: string;
        matchingId: string;
        qrCodeUrl?: string; // Data URI or URL
    };
    error?: string;
}

export interface EsimProvider {
    name: string;
    slug: string; // Unique identifier (e.g. "esim-go")

    /**
     * Fetch the full catalog from the provider and normalize it.
     */
    fetchCatalog(): Promise<NormalizedProduct[]>;

    /**
     * Place an order for a specific product ID.
     */
    order(productId: string): Promise<OrderResult>;

    /**
     * Get the current account balance.
     */
    getBalance(): Promise<number>;

    /**
     * Check if the API is reachable/valid.
     */
    checkHealth(): Promise<boolean>;

    /**
     * Get details for a specific eSIM.
     */
    getEsimDetails?(iccid: string): Promise<any>;

    /**
     * Get usage data for a specific eSIM.
     */
    getUsage?(iccid: string): Promise<any>;

    /**
     * Top up an existing eSIM.
     */
    topUp?(iccid: string, productId: string): Promise<OrderResult>;
}
