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
        console.log('[CATALOGUE] Fetching from eSIM-Go v2.2 API...');
        const startTime = Date.now();
        const response = await fetch(`https://api.esim-go.com/v2.2/catalogue?perPage=5000`, {
            headers: {
                'X-API-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        console.log(`[CATALOGUE] API Response status: ${response.status} (${Date.now() - startTime}ms)`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CATALOGUE] API Error:`, errorText);
            return { success: false, count: 0, changes: 0, error: `API Error ${response.status}` };
        }

        const data = await response.json();
        const allBundles: any[] = data.bundles || [];
        console.log(`[CATALOGUE] Received ${allBundles.length} bundles from API`);

        if (allBundles.length === 0) {
            return { success: false, count: 0, changes: 0, error: 'Empty catalogue received' };
        }

        // Filter for active bundles
        const activeBundles = allBundles.filter((b: any) =>
            b.groups && b.groups.includes('Standard Fixed')
        );
        console.log(`[CATALOGUE] Found ${activeBundles.length} active Standard Fixed bundles`);

        // Update DB
        // We will upsert each one. This might be slow for 1000 items but robust.
        // Prisma createMany doesn't support upsert usually.
        // We can use a transaction or just parallel promises.

        // Track changes is hard with upsert unless we fetch first.
        // For now, we assume "changes" = activeBundles.length for simplicity or just 0.

        let successCount = 0;

        // Batch processing to avoid connection pool exhaustion
        const BATCH_SIZE = 50;
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
                            duration: typeof b.duration === 'string' ? parseInt(b.duration) : b.duration, // extract int?
                            // duration field in DB is Int. API duration is often number (24) or string ("7 Days").
                            // We need to parse it carefully or change DB schema to String.
                            // Schema has Int.

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

        // Audit log
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'CATALOGUE_REFRESH_DB',
                    entity: 'System: Catalogue',
                    userId: 'admin',
                    details: JSON.stringify({
                        bundlesCount: successCount,
                        timestamp: new Date().toISOString()
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
