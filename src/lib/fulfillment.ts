
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/providers';
import { OrderResult } from '@/lib/providers/types';

export interface FulfillmentOptions {
    maxRetries?: number;
    allowCrossProviderFailover?: boolean;
}

export async function fulfillProduct(
    bundleId: string,
    preferredProviderId: string,
    options: FulfillmentOptions = {}
): Promise<OrderResult & { finalProviderId: string }> {
    const { maxRetries = 3, allowCrossProviderFailover = true } = options;

    // 1. Try preferred provider first
    let currentProviderId = preferredProviderId;
    let attempts = 0;
    let lastError = '';

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
