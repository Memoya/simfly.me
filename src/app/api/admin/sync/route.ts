
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

    // 🔥 ENTERPRISE CONFIG INJECTION
    // We must inject the database-stored configuration (API keys, etc.) into the provider engine
    const config = dbProvider.config as any;
    if (config) {
        if ((provider as any).config !== undefined) (provider as any).config = config;
        if (config.apiKey && (provider as any).apiKey !== undefined) (provider as any).apiKey = config.apiKey;
    }

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

    // Clear the table first using Prisma for reliability (ensures deactivated providers are removed)
    await prisma.bestOffer.deleteMany({});

    // Convert country overrides to a JSON string for the SQL query
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
                -- Check for country-specific margin in the JSON object
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

    console.log('[PRICING-ENGINE] Success: Catalog Materialized with Price Guard Protection.');
}
