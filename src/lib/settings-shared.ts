import { AdminSettings } from '@/types';

/**
 * Charm Pricing: Rounds prices to end in .99
 * - Under 50 cents → round down to .99 (e.g., 3.20 → 2.99)
 * - 50 cents or more → round up to .99 (e.g., 3.60 → 3.99)
 */
export function applyCharmPricing(price: number): number {
    const euros = Math.floor(price);
    const cents = Math.round((price - euros) * 100);
    
    if (cents < 50) {
        // Round down: 3.20 → 2.99
        return Math.max(0.99, euros - 1 + 0.99);
    } else {
        // Round up: 3.60 → 3.99
        return euros + 0.99;
    }
}

export function applyMargin(basePrice: number, settings: AdminSettings, region?: string, sku?: string): number {

    // 1. Check for specific product override (no rounding for manual overrides)
    if (sku && settings.productOverrides && settings.productOverrides[sku] !== undefined) {
        return settings.productOverrides[sku];
    }

    let marginPercent = settings.globalMarginPercent;
    let marginFixed = settings.globalMarginFixed;

    // 2. Override if country specific margin exists
    if (region && settings.countryMargins && settings.countryMargins[region]) {
        marginPercent = settings.countryMargins[region].percent;
        marginFixed = settings.countryMargins[region].fixed;
    }

    const margin = (basePrice * (marginPercent / 100)) + marginFixed;
    const rawPrice = basePrice + margin;
    
    // 3. Apply charm pricing (.99 rounding)
    return applyCharmPricing(rawPrice);
}
