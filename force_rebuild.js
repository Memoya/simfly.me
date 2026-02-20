
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rebuildCatalogue() {
    console.log('[REBUILD] Starting Pricing Engine Materialization...');

    try {
        const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
        const globalMarginPercent = settings?.globalMarginPercent || 20;
        const globalMarginFixed = settings?.globalMarginFixed || 0;
        const autoDiscountEnabled = settings?.autoDiscountEnabled || false;
        const autoDiscountPercent = settings?.autoDiscountPercent || 0;
        const autoDiscountThreshold = settings?.autoDiscountThreshold || 999999;
        const minMarginFixed = settings?.minMarginFixed ?? 1.0;
        const minMarginPercent = settings?.minMarginPercent ?? 5.0;

        // 1. Clear BestOffer (Clean slate)
        await prisma.bestOffer.deleteMany({});
        console.log(' - BestOffer table cleared.');

        // 2. Run the Materialization SQL
        const countryMargins = JSON.stringify(settings?.countryMargins || {});

        await prisma.$executeRaw`
            WITH ScoredProducts AS (
                SELECT 
                    p.id, p."providerId", p."providerProductId", p."countryCode",
                    p."dataAmountMB", p."validityDays", p.price as "costPrice",
                    pr."reliabilityScore", pr.priority,
                    (p.price * 1.0 + pr."reliabilityScore" * -5.0 + pr.priority * -2.0) as calculated_score
                FROM "ProviderProduct" p
                JOIN "Provider" pr ON p."providerId" = pr.id
                WHERE pr."isActive" = true
            ),
            Winners AS (
                SELECT DISTINCT ON ("countryCode", "dataAmountMB", "validityDays")
                    *
                FROM ScoredProducts
                ORDER BY "countryCode", "dataAmountMB", "validityDays", calculated_score ASC
            ),
            MarginRules AS (
                SELECT 
                    *,
                    (${countryMargins}::jsonb -> "countryCode") as override
                FROM Winners
            ),
            CalculatedPrices AS (
                SELECT 
                    *,
                    CASE 
                        WHEN override IS NOT NULL THEN
                            ("costPrice" * (1 + (override->>'percent')::float / 100.0) + (override->>'fixed')::float)
                        ELSE
                            ("costPrice" * (1 + ${globalMarginPercent} / 100.0) + ${globalMarginFixed})
                    END as standard_sell_price
                FROM MarginRules
            ),
            DiscountedPrices AS (
                SELECT 
                    *,
                    CASE 
                        WHEN ${autoDiscountEnabled} = true AND standard_sell_price >= ${autoDiscountThreshold}
                        THEN (standard_sell_price * (1 - ${autoDiscountPercent} / 100.0))
                        ELSE standard_sell_price
                    END as discounted_sell_price
                FROM CalculatedPrices
            ),
            PriceGuard AS (
                SELECT 
                    *,
                    GREATEST(
                        discounted_sell_price,
                        "costPrice" + ${minMarginFixed},
                        "costPrice" * (1 + ${minMarginPercent} / 100.0)
                    ) as final_guarded_price
                FROM DiscountedPrices
            )
            INSERT INTO "BestOffer" (
                id, "countryCode", "dataAmountMB", "validityDays", 
                "providerId", "providerProductId", "costPrice", 
                "sellPrice", margin, currency, "updatedAt"
            )
            SELECT 
                gen_random_uuid()::text,
                "countryCode", "dataAmountMB", "validityDays",
                "providerId", "providerProductId", "costPrice",
                final_guarded_price,
                (final_guarded_price - "costPrice") as margin,
                'USD', NOW()
            FROM PriceGuard;
        `;

        const newCount = await prisma.bestOffer.count();
        console.log(` - Rebuild Success! New BestOffer count: ${newCount}`);

    } catch (e) {
        console.error('Rebuild failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

rebuildCatalogue();
