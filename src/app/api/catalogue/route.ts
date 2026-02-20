import { Bundle, Product } from '@/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { getSettings, applyMargin } = await import('@/lib/settings');
        const { getCatalogue } = await import('@/lib/catalogue');

        const settings = await getSettings();
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');

        // API Key check
        const apiKey = process.env.ESIM_GO_API_KEY;
        if (!apiKey || apiKey === 'mock_esim_key') {
            console.warn('Using mock catalogue data (Key missing or mock)');
            const mockProducts: Product[] = [{
                id: 'mock_1',
                name: 'Mock Data 1GB',
                price: 5.00,
                region: 'Global',
                regionGroup: 'Global',
                data: '1GB',
                durationRaw: '7 Days',
                duration: '7 Tage',
            }];
            return NextResponse.json(mockProducts);
        }

        let bundles: Bundle[] = await getCatalogue();

        // Filter logic
        if (region) {
            const term = region.toLowerCase();
            bundles = bundles.filter((b: Bundle) => {
                const inCountry = b.countries && b.countries.some((c) =>
                    c.name.toLowerCase().includes(term) || c.iso.toLowerCase() === term
                );
                const inRegion = b.groups && b.groups.some((g) => g.toLowerCase().includes(term));
                return inCountry || inRegion;
            });
        }

        // Transform to LEAN frontend Product format
        const products: Product[] = bundles.map((b: Bundle) => {
            let dataSize = 'N/A';
            let unlimitedTier = '';

            if (b.dataAmount === -1 || (b.name && b.name.toLowerCase().includes('unlimited'))) {
                dataSize = 'Unlimited';
                // Detect tier
                if (b.name.includes('_ULP_')) unlimitedTier = 'Plus';
                else if (b.name.includes('_ULE_')) unlimitedTier = 'Essential';
                else if (b.name.includes('_UL_')) unlimitedTier = 'Lite';

                if (unlimitedTier) dataSize = `Unlimited ${unlimitedTier}`;
            } else if (b.dataAmount) {
                // Fix: Use binary base (1024) for accurate telecom data formatting
                dataSize = b.dataAmount >= 1024 ? `${b.dataAmount / 1024}GB` : `${b.dataAmount}MB`;
            } else if (b.dataLimitInBytes) {
                const gb = b.dataLimitInBytes / (1024 * 1024 * 1024);
                dataSize = gb >= 1 ? `${gb.toFixed(0)}GB` : `${(b.dataLimitInBytes / (1024 * 1024)).toFixed(0)}MB`;
            }

            let unlimitedDetails: Product['unlimitedDetails'] = undefined;
            if (dataSize.startsWith('Unlimited')) {
                const tier = unlimitedTier || 'Lite';
                if (tier === 'Plus') {
                    unlimitedDetails = { tier: 'Plus', highSpeed: '2GB', throttle: '2Mbps' };
                } else if (tier === 'Essential') {
                    unlimitedDetails = { tier: 'Essential', highSpeed: '1GB', throttle: '1.25Mbps' };
                } else {
                    unlimitedDetails = { tier: 'Standard', highSpeed: '1GB', throttle: '512Kbps' };
                }
            }

            const countryName = b.countries && b.countries.length > 0 ? b.countries[0].name : 'Global';
            const regionName = b.countries && b.countries.length > 0 ? b.countries[0].region : 'Other';

            return {
                id: b.name,
                name: `${countryName} ${dataSize}`,
                price: applyMargin(b.price || 0, settings, countryName),
                region: countryName,
                regionGroup: regionName || 'Other',
                data: dataSize,
                durationRaw: b.duration,
                duration: `${b.duration} ${b.duration === 1 ? 'Tag' : 'Tage'}`,
                iso: b.countries && b.countries.length > 0 ? b.countries[0].iso : undefined,
                unlimitedDetails,
            };
        });

        return NextResponse.json(products, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('Catalogue fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch catalogue' }, { status: 500 });
    }
}
