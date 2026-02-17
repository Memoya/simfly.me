import fs from 'fs/promises';
import path from 'path';
import { AdminSettings } from '@/types';
import { prisma } from '@/lib/prisma';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

export async function getSettings(): Promise<AdminSettings> {
    let jsonSettings: any = {};

    // 1. Read Legacy JSON
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        jsonSettings = JSON.parse(data);
    } catch (error) {
        // Default if file missing
        jsonSettings = {
            globalMarginPercent: 0,
            globalMarginFixed: 0,
            discountCodes: [],
            countryMargins: {}
        };
    }

    // 2. Read DB Settings
    let dbSettings = null;
    let dbOverrides: { sku: string; price: number | null }[] = [];
    try {
        dbSettings = await prisma.adminSettings.findUnique({
            where: { id: 'global' }
        });
        dbOverrides = await prisma.productOverride.findMany();
    } catch (dbError) {
        console.error('Failed to read settings from DB:', dbError);
    }

    // Transform overrides to map
    const overrideMap: Record<string, number> = {};
    dbOverrides.forEach(o => {
        if (o.price !== null) overrideMap[o.sku] = o.price;
    });

    // 3. Merge
    // If DB has settings, override global alert settings.
    return {
        ...jsonSettings, // Legacy fields
        lowBalanceAlertEnabled: dbSettings?.lowBalanceAlertEnabled ?? false,
        lowBalanceThreshold: dbSettings?.lowBalanceThreshold ?? 50.0,
        productOverrides: overrideMap,
        // Ensure defaults for legacy fields if missing in JSON
        discountCodes: jsonSettings.discountCodes || [],
        featuredDeals: jsonSettings.featuredDeals || [],
        countryMargins: jsonSettings.countryMargins || {},
    };
}

export async function saveSettings(settings: AdminSettings): Promise<void> {
    // 1. Save Legacy to JSON
    // Filter out DB fields if we want to keep JSON clean, or just dump everything?
    // Dumping everything is easier but duplicates data.
    // Let's try to keep JSON for legacy fields only? 
    // Actually, saving everything to JSON as backup is fine for now.

    const { passwordHash, ...safeSettings } = settings; // Don't verify auth here, just saving data passed.
    // Wait, typical use of saveSettings might include passwordHash if we are updating it.
    // We should respect what's passed.

    try {
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (err) {
        console.error('Failed to save settings to JSON:', err);
        throw err;
    }

    // 2. Save DB Settings
    try {
        await prisma.adminSettings.upsert({
            where: { id: 'global' },
            update: {
                lowBalanceAlertEnabled: settings.lowBalanceAlertEnabled ?? false,
                lowBalanceThreshold: settings.lowBalanceThreshold ?? 50.0,
            },
            create: {
                id: 'global',
                lowBalanceAlertEnabled: settings.lowBalanceAlertEnabled ?? false,
                lowBalanceThreshold: settings.lowBalanceThreshold ?? 50.0,
            }
        });
    } catch (dbError) {
        console.error('Failed to save settings to DB:', dbError);
        // Should we throw? If DB fails, application state is inconsistent.
        // Throwing is safer.
        throw dbError;
    }
}

export { applyMargin } from './settings-shared';
