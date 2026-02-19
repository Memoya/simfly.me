
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
                const products = await prisma.product.findMany();
                return products.map(p => ({
                    name: p.name,
                    price: p.price, // For legacy, cost = sell (margins handled in UI or separate)
                    costPrice: p.price,
                    description: p.description || '',
                    duration: p.duration || 0,
                    dataAmount: p.dataAmount || 0,
                    countries: (p.countries as any) || [],
                    groups: (p.groups as any) || [],
                }) as Bundle);
            }

            return bestOffers.map(offer => ({
                name: offer.providerProductId,
                price: offer.costPrice, // !!! IMPORTANT: We pass WHOLESALE here so checkout can apply margins correctly
                sellPrice: offer.sellPrice, // Reference only
                description: `${offer.dataAmountMB >= 1024 ? (offer.dataAmountMB / 1024) + 'GB' : offer.dataAmountMB + 'MB'} - ${offer.validityDays} Days`,
                duration: offer.validityDays,
                dataAmount: offer.dataAmountMB,
                countries: [{ iso: offer.countryCode, name: offer.countryCode }],
                groups: [],
                providerId: offer.providerId,
                providerProductId: offer.providerProductId
            }) as any);
        } catch (error) {
            console.error('Failed to get catalogue:', error);
            return [];
        }
    },
    ['global-catalogue'],
    {
        revalidate: 3600,
        tags: ['catalogue']
    }
);

export async function updateCatalogue(): Promise<{ success: boolean; count: number; changes: number; error?: string }> {
    return { success: true, count: 0, changes: 0 };
}
