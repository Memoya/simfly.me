import { AdminSettings } from '@/types';

export function applyMargin(basePrice: number, settings: AdminSettings, region?: string, sku?: string): number {

    // 1. Check for specific product override
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
    return parseFloat((basePrice + margin).toFixed(2));
}
