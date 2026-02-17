import fs from 'fs/promises';
import path from 'path';
import { getSettings, saveSettings } from './settings';
import { Bundle } from '@/types';

const CATALOGUE_PATH = path.join(process.cwd(), 'data', 'catalogue.json');

export async function getCatalogue(): Promise<Bundle[]> {
    try {
        const data = await fs.readFile(CATALOGUE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function updateCatalogue(): Promise<{ success: boolean; count: number; changes: number; error?: string }> {
    console.log('[CATALOGUE] Starting update process...');
    const apiKey = process.env.ESIM_GO_API_KEY;
    if (!apiKey) {
        console.error('[CATALOGUE] ESIM_GO_API_KEY is not set');
        return { success: false, count: 0, changes: 0, error: 'API key missing' };
    }

    try {
        console.log('[CATALOGUE] Fetching from eSIM-Go v2.5 API...');
        const startTime = Date.now();
        const response = await fetch(`https://api.esim-go.com/v2.5/catalogue?perPage=5000`, {
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
            console.warn('[CATALOGUE] No bundles received from API');
            return { success: false, count: 0, changes: 0, error: 'Empty catalogue received' };
        }

        // Filter for active bundles
        const activeBundles = allBundles.filter((b: any) =>
            b.groups && b.groups.includes('Standard Fixed')
        );
        console.log(`[CATALOGUE] Found ${activeBundles.length} active Standard Fixed bundles`);

        // Get existing settings
        console.log('[CATALOGUE] Loading existing settings...');
        const settings = await getSettings();
        const currentCatalogue = (settings as any).catalogue || { bundles: [] };
        const oldBundles = currentCatalogue.bundles || [];
        const oldNames = new Set(oldBundles.map((b: any) => b.name));

        let changes = 0;
        const newBundles = activeBundles.map((b: any) => {
            if (!oldNames.has(b.name)) changes++;
            return {
                name: b.name,
                description: b.description,
                countries: b.countries || [],
                price: b.price,
                currency: b.currency || 'USD',
                dataAmount: b.dataAmount,
                billingType: b.billingType,
                profileName: b.profileName,
                imageUrl: b.imageUrl,
            };
        });

        const updatedCatalogue = {
            lastUpdated: new Date().toISOString(),
            bundles: newBundles
        };

        // Save back to settings
        console.log('[CATALOGUE] Saving updated settings...');
        await saveSettings({
            ...settings,
            catalogue: updatedCatalogue
        } as any);
        console.log('[CATALOGUE] Settings saved successfully');

        // Explicitly write to catalogue.json
        try {
            await fs.mkdir(path.dirname(CATALOGUE_PATH), { recursive: true });
            await fs.writeFile(CATALOGUE_PATH, JSON.stringify(newBundles, null, 2), 'utf-8');
            console.log('[CATALOGUE] catalogue.json updated');
        } catch (fsError) {
            console.warn('[CATALOGUE] Could not write to catalogue.json:', fsError);
        }

        // Audit log
        try {
            console.log('[CATALOGUE] Creating audit log...');
            const { prisma } = await import('@/lib/prisma');
            await prisma.auditLog.create({
                data: {
                    action: 'CATALOGUE_REFRESH',
                    entity: 'System: Catalogue',
                    userId: 'admin',
                    details: JSON.stringify({
                        bundlesCount: updatedCatalogue.bundles.length,
                        timestamp: updatedCatalogue.lastUpdated,
                        changes
                    })
                }
            });
            console.log('[CATALOGUE] Audit log created');
        } catch (dbError: any) {
            console.error('[CATALOGUE] Failed to create audit log:', dbError.message || dbError);
            // We don't fail the whole operation if just the audit log fails
        }

        return { success: true, count: updatedCatalogue.bundles.length, changes };
    } catch (error: any) {
        console.error('[CATALOGUE] Fatal error during update:', error);
        return { success: false, count: 0, changes: 0, error: error.message || 'Fatal error' };
    }
}
