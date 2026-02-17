/**
 * Get flag image URL from FlagCDN for a given country ISO code
 * @param isoCode - Two-letter country code (e.g., "US", "DE", "TH")
 * @param size - Size variant (w20, w40, w80, w160)
 * @returns Flag image URL or fallback globe emoji
 */
export function getCountryFlagUrl(isoCode: string | undefined, size: 'w20' | 'w40' | 'w80' | 'w160' = 'w80'): string {
    if (!isoCode || isoCode.length !== 2) {
        return ''; // Return empty for fallback
    }

    return `https://flagcdn.com/${size}/${isoCode.toLowerCase()}.png`;
}

/**
 * DEPRECATED: Use getCountryFlagUrl instead
 * Convert ISO 3166-1 alpha-2 country code to flag emoji
 * @param isoCode - Two-letter country code (e.g., "US", "DE", "TH")
 * @returns Flag emoji or empty string if invalid
 */
export function getCountryFlag(isoCode: string | undefined): string {
    if (!isoCode || isoCode.length !== 2) return '🌍';

    const codePoints = isoCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}

import { Product } from "@/types";

/**
 * Get all unique regions from products
 */
export function getUniqueRegions(products: Product[]): string[] {
    const regions = new Set<string>();
    products.forEach(p => {
        if (p.regionGroup) regions.add(p.regionGroup);
    });
    return Array.from(regions).sort();
}
