import { AdminSettings } from '@/types';
import { prisma } from '@/lib/prisma';

export async function getSettings(): Promise<AdminSettings> {
    let settings: AdminSettings = {
        globalMarginPercent: 0,
        globalMarginFixed: 0,
        discountCodes: [],
        countryMargins: {},
        featuredDeals: [],
        banner: { active: false, text: '', link: '' },
        faq: []
    };

    try {
        const dbSettings = await prisma.adminSettings.findUnique({
            where: { id: 'global' }
        });

        if (dbSettings) {
            settings = {
                ...settings,
                ...dbSettings,
                // Cast JSON to correct types if needed (Prisma returns JsonValue)
                countryMargins: (dbSettings.countryMargins as any) || {},
                discountCodes: (dbSettings.discountCodes as any) || [],
                featuredDeals: (dbSettings.featuredDeals as any) || [],
                banner: (dbSettings.banner as any) || { active: false, text: '', link: '' },
                faq: (dbSettings.faq as any) || []
            };
        }

        // Product Overrides are separate model
        const dbOverrides = await prisma.productOverride.findMany();
        const overrideMap: Record<string, number> = {};
        dbOverrides.forEach(o => {
            if (o.price !== null) overrideMap[o.sku] = o.price;
        });

        return {
            ...settings,
            productOverrides: overrideMap
        };

    } catch (error) {
        console.error('Failed to get settings:', error);
        return settings;
    }
}

export async function saveSettings(settings: AdminSettings): Promise<void> {
    try {
        // Separate out non-DB fields or handle purely via AdminSettings model
        // We need to remove fields that are not in the database model or are calculated
        // But for update/create we just pass the matching fields

        await prisma.adminSettings.upsert({
            where: { id: 'global' },
            update: {
                lowBalanceAlertEnabled: settings.lowBalanceAlertEnabled ?? false,
                lowBalanceThreshold: settings.lowBalanceThreshold ?? 50.0,
                globalMarginPercent: settings.globalMarginPercent ?? 0,
                globalMarginFixed: settings.globalMarginFixed ?? 0,
                countryMargins: (settings.countryMargins || {}) as any,
                discountCodes: (settings.discountCodes || []) as any,
                featuredDeals: (settings.featuredDeals || []) as any,
                banner: (settings.banner || {}) as any,
                faq: (settings.faq || []) as any
            },
            create: {
                id: 'global',
                lowBalanceAlertEnabled: settings.lowBalanceAlertEnabled ?? false,
                lowBalanceThreshold: settings.lowBalanceThreshold ?? 50.0,
                globalMarginPercent: settings.globalMarginPercent ?? 0,
                globalMarginFixed: settings.globalMarginFixed ?? 0,
                countryMargins: (settings.countryMargins || {}) as any,
                discountCodes: (settings.discountCodes || []) as any,
                featuredDeals: (settings.featuredDeals || []) as any,
                banner: (settings.banner || {}) as any,
                faq: (settings.faq || []) as any
            }
        });
    } catch (dbError) {
        console.error('Failed to save settings to DB:', dbError);
        throw dbError;
    }
}

export { applyMargin } from './settings-shared';
