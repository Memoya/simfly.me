export interface Product {
    id: string;
    name: string;
    price: number;
    region: string;
    regionGroup: string;
    data: string;
    durationRaw?: number | string;
    duration: string;
    iso?: string;
    unlimitedDetails?: {
        tier: 'Standard' | 'Essential' | 'Plus';
        highSpeed: string;
        throttle: string;
    };
}

export interface CartItem extends Product {
    quantity: number;
}

export type EventType = 'VIEW_CATALOGUE' | 'ADD_TO_CART' | 'START_CHECKOUT' | 'PURCHASE_SUCCESS' | 'VIEW_DEAL';

export interface Bundle {
    name: string;
    price: number;
    description: string;
    duration: string | number;
    dataAmount: number;
    dataLimitInBytes: number;
    countries?: Array<{
        name: string;
        iso: string;
        region?: string;
    }>;
    groups?: string[];
}

export interface CountryGroup {
    country: string;
    iso: string;
    packages: Product[];
    minPrice: number;
    regionGroup: string;
}

export interface DiscountCode {
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    active: boolean;
}

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FeaturedDeal {
    id: string;
    productId?: string; // Reference to the actual product
    country: string;
    iso: string;
    data: string;
    days: number;
    price: number;
    region: string;
}

export interface AdminSettings {
    globalMarginPercent: number;
    globalMarginFixed: number;
    passwordHash?: string;
    discountCodes: DiscountCode[];
    featuredDeals?: FeaturedDeal[];
    countryMargins: Record<string, { percent: number; fixed: number }>;
    banner?: {
        active: boolean;
        text: string;
        link?: string;
    };
    faq?: FAQItem[];
    autoDiscountEnabled?: boolean;
    autoDiscountPercent?: number;
    autoDiscountThreshold?: number;
    catalogueLastUpdated?: string;
    catalogueLastChangeCount?: number;
    // New fields for auto-alert
    lowBalanceAlertEnabled?: boolean;
    lowBalanceThreshold?: number;
    // New fields for price overrides
    productOverrides?: Record<string, number>;
    // Price Guard
    minMarginFixed?: number;
    minMarginPercent?: number;
}
