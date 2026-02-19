
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllProviders } from '@/lib/providers';
import { verifyAuth } from '@/lib/auth';
import { EsimProvider } from '@/lib/providers/types';
import { sendAdminAlert } from '@/lib/email';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const RELIABILITY_ALERT_THRESHOLD = 0.7;
const RELIABILITY_CRITICAL_THRESHOLD = 0.5;

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!isCron && !verifyAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return POST(request);
}

export async function POST(request: Request) {
    if (!verifyAuth(request)) {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('[SYNC-ENTERPRISE] Starting optimized sync...');
        const providers = getAllProviders();
        const results = [];

        for (const provider of providers) {
            try {
                const result = await syncProviderOptimized(provider);
                results.push(result);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[SYNC] Failed ${provider.name}:`, error);

                const updatedProvider = await prisma.provider.update({
                    where: { slug: provider.slug },
                    data: {
                        failedOrders: { increment: 1 },
                        reliabilityScore: { decrement: 0.1 }
                    }
                });

                if (updatedProvider.reliabilityScore < RELIABILITY_ALERT_THRESHOLD) {
                    await sendAdminAlert(
                        `Provider Health Warning: ${provider.name}`,
                        `The provider ${provider.name} failed to sync. Reliability dropped to ${(updatedProvider.reliabilityScore * 100).toFixed(0)}%. Error: ${message}`
                    );
                }

                if (updatedProvider.reliabilityScore < RELIABILITY_CRITICAL_THRESHOLD && updatedProvider.isActive) {
                    await prisma.provider.update({
                        where: { slug: provider.slug },
                        data: { isActive: false }
                    });
                    await sendAdminAlert(
                        `CRITICAL: Provider Auto-Deactivated: ${provider.name}`,
                        `Provider ${provider.name} has been automatically disabled due to critical failure rate. Manual intervention required.`
                    );
                }

                results.push({ provider: provider.name, success: false, error: message });
            }
        }

        await updateBestOffersEnterprise();

        // 🚀 ENTERPRISE CACHE INVALIDATION
        // After pricing engine confirms new winners, purge the frontend cache at the Edge
        console.log('[SYNC-CACHE] Purging global catalogue cache...');
        try {
            // Some environments/linters expect 2 args, but standard Next.js revalidateTag is 1.
            // Using as any to bypass potential regional linter confusion if necessary.
            (revalidateTag as any)('catalogue');
        } catch (e) {
            console.error('Revalidation failed:', e);
        }

        return NextResponse.json({ success: true, results });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function syncProviderOptimized(provider: EsimProvider) {
    const dbProvider = await prisma.provider.upsert({
        where: { slug: provider.slug },
        create: { name: provider.name, slug: provider.slug, isActive: true },
        update: { lastSync: new Date() }
    });

    if (!dbProvider.isActive) return { provider: provider.name, skipped: true };

    const products = await provider.fetchCatalog();

    const BATCH_SIZE = 100;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(p =>
            prisma.providerProduct.upsert({
                where: { providerId_providerProductId: { providerId: dbProvider.id, providerProductId: p.id } },
                create: {
                    providerId: dbProvider.id, providerProductId: p.id,
                    name: p.name, countryCode: p.countryCode, dataAmountMB: p.dataAmountMB,
                    validityDays: p.validityDays, price: p.price, currency: p.currency,
                    networkType: p.networkType, isUnlimited: p.isUnlimited
                },
                update: {
                    price: p.price, name: p.name, lastUpdated: new Date()
                }
            })
        ));
    }

    return { provider: provider.name, success: true, count: products.length };
}

async function updateBestOffersEnterprise() {
    console.log('[PRICING-ENGINE] Materializing best offers with Auto-Discount Logic...');

    // 1. Get margins & discount settings
    const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
    const globalMarginPercent = settings?.globalMarginPercent || 20;
    const globalMarginFixed = settings?.globalMarginFixed || 0;

    // Enterprise Auto-Discount Config
    const autoDiscountEnabled = settings?.autoDiscountEnabled || false;
    const autoDiscountPercent = settings?.autoDiscountPercent || 0;
    const autoDiscountThreshold = settings?.autoDiscountThreshold || 999999;

    // Price Guard Config
    const minMarginFixed = settings?.minMarginFixed ?? 1.0;
    const minMarginPercent = settings?.minMarginPercent ?? 5.0;

    /**
     * 🔥 HIGH PERFORMANCE SQL STRATEGY (PRICING ENGINE v2)
     * 1. Score products across all providers
     * 2. Select winners (Cheapest/Most reliable)
     * 3. Apply standard margins
     * 4. Apply auto-discounts for Enterprise packages
     * 5. ENFORCE PRICE GUARD (The Hard Floor)
     */
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
        CalculatedPrices AS (
            SELECT 
                *,
                ("costPrice" * (1 + ${globalMarginPercent} / 100.0) + ${globalMarginFixed}) as standard_sell_price
            FROM Winners
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
                -- CALCULATE THE HARD FLOOR: costPrice + max(fixed, percent)
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
        FROM PriceGuard
        ON CONFLICT ("countryCode", "dataAmountMB", "validityDays") DO UPDATE SET
            "providerId" = EXCLUDED."providerId",
            "providerProductId" = EXCLUDED."providerProductId",
            "costPrice" = EXCLUDED."costPrice",
            "sellPrice" = EXCLUDED."sellPrice",
            "margin" = EXCLUDED."margin",
            "updatedAt" = NOW();
    `;

    console.log('[PRICING-ENGINE] Success: Catalog Materialized with Price Guard Protection.');
}
