import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { Bundle } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        // Dynamic imports
        const { getSettings, applyMargin } = await import('@/lib/settings');

        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page')) || 0;
        const limit = Number(searchParams.get('limit')) || 30;
        const search = (searchParams.get('search') || '').toLowerCase();
        const sort = searchParams.get('sort') || ''; // 'name', 'region', 'price', 'profit'
        const order = searchParams.get('order') || 'asc'; // 'asc', 'desc'

        const settings = await getSettings();
        const apiKey = process.env.ESIM_GO_API_KEY;

        let allBundles: Bundle[] = [];

        // Mock Data if no API key
        if (!apiKey || apiKey === 'mock_esim_key') {
            allBundles = Array.from({ length: 50 }).map((_, i) => ({
                name: `Mock Data ${i + 1}GB`,
                price: 5.00 + i,
                description: `Mock Description ${i + 1}`,
                region: i % 2 === 0 ? 'Europe' : 'Asia',
                countries: [{ name: i % 2 === 0 ? 'Germany' : 'Japan', iso: i % 2 === 0 ? 'DE' : 'JP', region: i % 2 === 0 ? 'Europe' : 'Asia' }],
                dataAmount: 1000 * (i + 1),
                duration: 30,
                dataLimitInBytes: 1000 * (i + 1) * 1024 * 1024,
                groups: []
            }));
        } else {
            try {
                // Use local cache
                const { getCatalogue, updateCatalogue } = await import('@/lib/catalogue');
                allBundles = await getCatalogue();

                // If empty, force update once
                if (allBundles.length === 0) {
                    const result = await updateCatalogue();
                    if (result.success) {
                        allBundles = await getCatalogue();
                    }
                }
            } catch (error) {
                console.error('Inner catalogue fetch failed:', error);
                // Continue with empty bundles
            }
        }

        // Process all items: Calculate Sell Price & Profit
        let processed = allBundles.map((b: any) => {
            const region = b.countries && b.countries.length > 0 ? b.countries[0].name : 'Global';
            const iso = b.countries && b.countries.length > 0 ? b.countries[0].iso : '';
            const regionGroup = b.groups && b.groups.length > 0 ? b.groups[0] : 'Global';
            const price = b.price || 0;
            const sellPrice = applyMargin(price, settings, region);
            const profit = sellPrice - price;

            // Extract data amount (e.g., "1GB", "10GB", "Unlimited")
            let data = 'N/A';
            let unlimitedTier = '';

            if (b.dataAmount === -1 || (b.name && b.name.toLowerCase().includes('unlimited'))) {
                data = 'Unlimited';
                // Detect tier
                if (b.name.includes('_ULP_')) unlimitedTier = 'Plus';
                else if (b.name.includes('_ULE_')) unlimitedTier = 'Essential';
                else if (b.name.includes('_UL_')) unlimitedTier = 'Lite';

                if (unlimitedTier) data = `Unlimited ${unlimitedTier}`;
            } else if (b.dataAmount && typeof b.dataAmount === 'number') {
                // dataAmount is in MB, convert to GB
                const mb = b.dataAmount;
                if (mb >= 1000) {
                    data = `${Math.round(mb / 1000)}GB`;
                } else {
                    data = `${mb}MB`;
                }
            } else if (b.dataLimitInBytes) {
                const gb = b.dataLimitInBytes / (1024 * 1024 * 1024);
                data = gb >= 1 ? `${Math.round(gb)}GB` : `${Math.round(gb * 1024)}MB`;
            } else if (b.name) {
                // Try to extract from name (e.g., "esim_1GB_7D_DE_V2")
                const gbMatch = b.name.match(/(\d+)GB/i);
                const mbMatch = b.name.match(/(\d+)MB/i);
                if (gbMatch) data = `${gbMatch[1]}GB`;
                else if (mbMatch) data = `${mbMatch[1]}MB`;
            }

            // Extract duration (e.g., "7 Days", "30 Days")
            let duration = 'N/A';
            let durationRaw: number | string = 7;
            if (typeof b.duration === 'number') {
                durationRaw = b.duration;
                duration = `${b.duration} ${b.duration === 1 ? 'Day' : 'Days'}`;
            } else if (typeof b.duration === 'string') {
                duration = b.duration;
                const match = b.duration.match(/(\d+)/);
                if (match) durationRaw = parseInt(match[1]);
            } else if (b.name) {
                // Extract from name (e.g., "7D" = 7 days)
                const daysMatch = b.name.match(/(\d+)D/i);
                if (daysMatch) {
                    const days = parseInt(daysMatch[1]);
                    durationRaw = days;
                    duration = `${days} ${days === 1 ? 'Day' : 'Days'}`;
                }
            }

            let unlimitedDetails = undefined;
            if (data.startsWith('Unlimited')) {
                const tier = unlimitedTier || 'Lite';
                if (tier === 'Plus') {
                    unlimitedDetails = { tier: 'Plus', highSpeed: '2GB', throttle: '2Mbps' };
                } else if (tier === 'Essential') {
                    unlimitedDetails = { tier: 'Essential', highSpeed: '1GB', throttle: '1.25Mbps' };
                } else {
                    unlimitedDetails = { tier: 'Standard', highSpeed: '1GB', throttle: '512Kbps' };
                }
            }

            return {
                id: b.name, // Use name as ID
                name: b.name,
                price: price,
                region: region,
                regionGroup: regionGroup,
                iso: iso,
                data: data,
                duration: duration,
                durationRaw: durationRaw,
                unlimitedDetails: unlimitedDetails,
                sellPrice: sellPrice,
                profit: profit
            };
        });

        // 1. Filter
        if (search) {
            processed = processed.filter((p: any) =>
                p.name.toLowerCase().includes(search) ||
                p.region.toLowerCase().includes(search)
            );
        }

        // 2. Sort
        if (sort) {
            processed.sort((a: any, b: any) => {
                let valA = a[sort as keyof typeof a];
                let valB = b[sort as keyof typeof b];

                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = (valB as string).toLowerCase();
                }

                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // 3. Paginate
        const total = processed.length;
        const start = page * limit;
        const end = start + limit;
        const products = processed.slice(start, end);

        return NextResponse.json({
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Failed to fetch catalogue (Outer):', error);
        return NextResponse.json({ error: 'Failed to fetch catalogue' }, { status: 500 });
    }
}
