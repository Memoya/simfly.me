
import { prisma } from '@/lib/prisma';
import { Bundle } from '@/types';
import { unstable_cache } from 'next/cache';

/**
 * Enterprise Caching Layer
 * Caches the BestOffer results to provide sub-100ms response times for the storefront.
 * Uses 'catalogue' tag for on-demand invalidation after sync.
 */
export const getCatalogue = unstable_cache(
    async (): Promise<Bundle[]> => {
        try {
            console.log('[CACHE-MISS] Fetching catalogue from Database...');
            const bestOffers = await prisma.bestOffer.findMany();

            if (bestOffers.length === 0) {
                console.warn('[CATALOGUE] BestOffer table is empty. No products to display.');
                return [];
            }

            // Fetch ProviderProduct details for extra info (like networkType)
            const providerProducts = await prisma.providerProduct.findMany({
                where: {
                    OR: bestOffers.map(o => ({
                        providerId: o.providerId,
                        providerProductId: o.providerProductId
                    }))
                }
            });

            // Map for quick lookup
            const ppMap = new Map(providerProducts.map(pp => [`${pp.providerId}-${pp.providerProductId}`, pp]));

            return bestOffers.map(offer => {
                const pp = ppMap.get(`${offer.providerId}-${offer.providerProductId}`);
                const dataStr = offer.dataAmountMB >= 1024 ? (offer.dataAmountMB / 1024) + 'GB' : offer.dataAmountMB + 'MB';

                // Get original name and clean it up
                let cleanName = pp?.name || `${offer.countryCode} - ${dataStr}`;
                // Remove provider prefixes if they exist in the name string
                cleanName = cleanName.replace(/^eSIMAccess\s*-\s*/i, '')
                    .replace(/^eSIMAccess\s+/i, '')
                    .replace(/\s*eSIMAccess\s*/i, '');

                // Helper to get full country name
                let countryFullName = offer.countryCode;
                try {
                    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                    countryFullName = regionNames.of(offer.countryCode.toUpperCase()) || offer.countryCode;
                } catch (e) {
                    console.warn(`[CATALOGUE] Failed to map ISO ${offer.countryCode} to name`, e);
                }

                return {
                    id: offer.id,
                    name: cleanName,
                    providerName: 'eSIMAccess', // Dedicated field for the manufacturer badge
                    price: offer.costPrice,
                    sellPrice: offer.sellPrice,
                    description: `${dataStr} - ${offer.validityDays} Days`,
                    duration: offer.validityDays,
                    dataAmount: offer.dataAmountMB,
                    countries: [{ iso: offer.countryCode, name: countryFullName }],
                    groups: [],
                    providerId: offer.providerId,
                    providerProductId: offer.providerProductId,
                    speed: pp?.networkType || '4G/5G'
                } as any;
            });
        } catch (error) {
            console.error('Failed to get catalogue:', error);
            return [];
        }
    },
    ['global-catalogue-v4'],
    {
        revalidate: 3600,
        tags: ['catalogue']
    }
);

export async function updateCatalogue(): Promise<{ success: boolean; count: number; changes: number; error?: string }> {
    return { success: true, count: 0, changes: 0 };
}
