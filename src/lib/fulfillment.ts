
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/providers';
import { OrderResult } from '@/lib/providers/types';

export interface FulfillmentOptions {
    maxRetries?: number;
    allowCrossProviderFailover?: boolean;
}

export async function fulfillProduct(
    bundleId: string,
    preferredProviderId?: string,
    options: FulfillmentOptions = {}
): Promise<OrderResult & { finalProviderId: string }> {
    const { maxRetries = 3, allowCrossProviderFailover = true } = options;

    // 0. If no provider specified, auto-select from BestOffer
    let currentProviderId: string = preferredProviderId || '';
    if (!currentProviderId) {
        console.log(`[Fulfillment] No provider specified, looking up best offer for ${bundleId}`);
        
        // Try to find by providerProductId first
        const bestOffer = await prisma.bestOffer.findFirst({
            where: { 
                providerProductId: bundleId
            }
        });
        
        if (bestOffer) {
            currentProviderId = bestOffer.providerId;
            bundleId = bestOffer.providerProductId;
            console.log(`[Fulfillment] Auto-selected provider ${currentProviderId} for SKU ${bundleId}`);
        } else {
            // Fallback: try finding ANY matching product by providerProductId
            const anyProduct = await prisma.providerProduct.findFirst({
                where: { 
                    providerProductId: bundleId,
                    provider: { isActive: true }
                },
                orderBy: { provider: { priority: 'desc' } }
            });
            
            if (anyProduct) {
                currentProviderId = anyProduct.providerId;
                console.log(`[Fulfillment] Fallback selected provider ${currentProviderId}`);
            } else {
                return {
                    success: false,
                    providerOrderReference: '',
                    error: `No active provider found for product ${bundleId}`,
                    finalProviderId: 'none'
                };
            }
        }
    }

    // 1. Try preferred/selected provider first
    let attempts = 0;
    let lastError = '';

    if (!currentProviderId) {
        return {
            success: false,
            providerOrderReference: '',
            error: 'No provider could be determined',
            finalProviderId: 'none'
        };
    }

    while (attempts < maxRetries) {
        attempts++;
        const provider = getProvider(currentProviderId);
        if (!provider) {
            lastError = `Provider ${currentProviderId} not found`;
            break;
        }

        console.log(`[Fulfillment] Attempt ${attempts} using ${currentProviderId} for SKU ${bundleId}`);
        const result = await provider.order(bundleId);

        if (result.success) {
            return { ...result, finalProviderId: currentProviderId };
        }

        lastError = result.error || 'Unknown provider error';
        console.warn(`[Fulfillment] Attempt ${attempts} failed: ${lastError}`);

        // 2. If failover is allowed, find next best provider
        if (allowCrossProviderFailover) {
            // Find a comparable product from another provider
            // We need the original product details to find a match
            const sourceProduct = await prisma.providerProduct.findFirst({
                where: { providerProductId: bundleId, provider: { slug: preferredProviderId } }
            });

            if (sourceProduct) {
                const alternate = await prisma.providerProduct.findFirst({
                    where: {
                        countryCode: sourceProduct.countryCode,
                        dataAmountMB: { gte: sourceProduct.dataAmountMB },
                        validityDays: { gte: sourceProduct.validityDays },
                        provider: {
                            isActive: true,
                            slug: { not: currentProviderId }
                        }
                    },
                    orderBy: [
                        { price: 'asc' },
                        { provider: { priority: 'desc' } }
                    ]
                });

                if (alternate) {
                    console.log(`[Fulfillment] Failing over to ${alternate.providerId} with SKU ${alternate.providerProductId}`);
                    currentProviderId = alternate.providerId; // This assumes providerId in schema is the slug
                    bundleId = alternate.providerProductId;
                    continue; // Try next attempt with new provider
                }
            }
        }

        // Small delay between retries if it's the same provider
        if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
    }

    return {
        success: false,
        providerOrderReference: '',
        error: lastError,
        finalProviderId: currentProviderId
    };
}
