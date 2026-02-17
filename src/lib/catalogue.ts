import { prisma } from '@/lib/prisma';
import { Bundle } from '@/types';

// No longer using file system
// const CATALOGUE_PATH = path.join(process.cwd(), 'data', 'catalogue.json');

export async function getCatalogue(): Promise<Bundle[]> {
    try {
        const products = await prisma.product.findMany();
        return products.map(p => ({
            name: p.name,
            price: p.price,
            description: p.description || '',
            duration: p.duration || 0,
            dataAmount: p.dataAmount || 0,
            dataLimitInBytes: 0, // Not stored in DB explicitly in this simple schema, or derived?
            // Actually API gives dataAmount or dataLimitInBytes. We stored dataAmount.
            // Let's assume dataAmount in MB matching API mostly.

            countries: (p.countries as any) || [],
            groups: (p.groups as any) || [],

            // Extra fields not in strict Bundle interface but useful?
            // Bundle interface in types/index.ts:
            // name, price, description, duration, dataAmount, dataLimitInBytes, countries, groups
        }) as Bundle);
    } catch (error) {
        console.error('Failed to get catalogue from DB:', error);
        return [];
    }
}

export async function updateCatalogue(): Promise<{ success: boolean; count: number; changes: number; error?: string }> {
    console.log('[CATALOGUE] Starting update process (DB Mode)...');
    const apiKey = process.env.ESIM_GO_API_KEY;
    if (!apiKey) {
        console.error('[CATALOGUE] ESIM_GO_API_KEY is not set');
        return { success: false, count: 0, changes: 0, error: 'API key missing' };
    }

    try {
        console.log('[CATALOGUE] Fetching from eSIM-Go v2.4 API (Full Pagination)...');
        const startTime = Date.now();
        let allBundles: any[] = [];
        let page = 0;
        let totalPages = 1;
        const perPage = 1000; // Smaller chunks are safer

        do {
            console.log(`[CATALOGUE] Fetching page ${page + 1}...`);
            const response = await fetch(`https://api.esim-go.com/v2.4/catalogue?perPage=${perPage}&page=${page}`, {
                headers: {
                    'X-API-Key': apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                // If one page fails, we abort to avoid partial state confusion
                throw new Error(`API Error on page ${page + 1}: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            const bundles = data.bundles || [];
            allBundles = [...allBundles, ...bundles];

            // Update pagination info locally
            if (data.totalPages) {
                totalPages = data.totalPages;
            } else if (data.pages) {
                totalPages = data.pages;
            } else {
                // Fallback if API doesn't send totalPages in v2.4 (some versions differ)
                // If we got full page, assume there might be more
                totalPages = bundles.length < perPage ? page + 1 : page + 2;
            }

            console.log(`[CATALOGUE] Page ${page + 1} done. Got ${bundles.length} items. Total so far: ${allBundles.length}`);
            page++;

        } while (page < totalPages);


        console.log(`[CATALOGUE] Total bundles fetched: ${allBundles.length} in ${Date.now() - startTime}ms`);

        if (allBundles.length === 0) {
            return { success: false, count: 0, changes: 0, error: 'Empty catalogue received' };
        }

        // Filter: Import everything valid
        const activeBundles = allBundles.filter((b: any) =>
            b.name && b.price > 0
        );
        console.log(`[CATALOGUE] Found ${activeBundles.length} active bundles (All valid)`);

        // Update DB
        let successCount = 0;
        const BATCH_SIZE = 50;

        // We wipe nothing, we just upsert. Old products remain (maybe verify if we should delete old ones? User asked for stability, upsert is safest).

        for (let i = 0; i < activeBundles.length; i += BATCH_SIZE) {
            const batch = activeBundles.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (b: any) => {
                try {
                    await prisma.product.upsert({
                        where: { id: b.name },
                        update: {
                            description: b.description,
                            price: b.price,
                            currency: b.currency || 'USD',
                            dataAmount: b.dataAmount, // MB
                            duration: typeof b.duration === 'string' ? parseInt(b.duration) : b.duration,
                            countries: b.countries || [],
                            groups: b.groups || [],
                            billingType: b.billingType,
                            profileName: b.profileName,
                            imageUrl: b.imageUrl,
                        },
                        create: {
                            id: b.name,
                            name: b.name,
                            description: b.description,
                            price: b.price,
                            currency: b.currency || 'USD',
                            dataAmount: b.dataAmount,
                            duration: typeof b.duration === 'string' ? parseInt(b.duration) : b.duration,
                            countries: b.countries || [],
                            groups: b.groups || [],
                            billingType: b.billingType,
                            profileName: b.profileName,
                            imageUrl: b.imageUrl,
                        }
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to upsert product ${b.name}`, err);
                }
            }));
        }

        console.log(`[CATALOGUE] Successfully synced ${successCount} products to DB`);

        // Calculate group statistics for the Audit Log
        const groupStats: Record<string, number> = {};
        activeBundles.forEach((b: any) => {
            const groups = b.groups || ['No Group'];
            groups.forEach((g: string) => {
                groupStats[g] = (groupStats[g] || 0) + 1;
            });
        });

        // Audit log
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'CATALOGUE_REFRESH_DB',
                    entity: 'System: Catalogue',
                    userId: 'admin',
                    details: JSON.stringify({
                        bundlesCount: successCount,
                        timestamp: new Date().toISOString(),
                        groupsFound: groupStats,
                        apiVersion: 'v2.4' // Log version
                    })
                }
            });
        } catch { }

        return { success: true, count: successCount, changes: successCount };
    } catch (error: any) {
        console.error('[CATALOGUE] Fatal error during update:', error);
        return { success: false, count: 0, changes: 0, error: error.message || 'Fatal error' };
    }
}
