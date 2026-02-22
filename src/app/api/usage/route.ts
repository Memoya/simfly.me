import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const iccid = searchParams.get('iccid');

    if (!iccid) {
        return NextResponse.json({ error: 'ICCID is required' }, { status: 400 });
    }

    const isTestMode = process.env.ESIM_ACCESS_TEST_MODE === 'true';

    if (isTestMode) {
        // Mock Response for testing
        return NextResponse.json({
            iccid,
            totalData: 10, // GB
            remainingData: 8.5, // GB
            status: 'active',
            expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), // +15 days
            bundles: [
                { name: 'esim_10gb_30d', assignments: [{ status: 'active', initialQuantity: 10737418240, remainingQuantity: 9126805504 }] }
            ]
        });
    }

    try {
        const provider = getProvider('esim-access');
        
        if (!provider) {
            return NextResponse.json({ error: 'eSIM provider not configured' }, { status: 500 });
        }

        // Check if provider supports usage queries
        if (!provider.getEsimDetails || !provider.getUsage) {
            return NextResponse.json({ error: 'Provider does not support usage queries' }, { status: 501 });
        }

        // Fetch live data from eSIM Access API
        const esimDetails = await provider.getEsimDetails(iccid);
        const usageData = await provider.getUsage(iccid);

        console.log('[Usage API] eSIM Details:', JSON.stringify(esimDetails, null, 2));
        console.log('[Usage API] Usage Data:', JSON.stringify(usageData, null, 2));

        if (!esimDetails && !usageData) {
            // Fallback to database if API returns nothing
            const { prisma } = await import('@/lib/prisma');
            const item = await prisma.orderItem.findFirst({
                where: { iccid }
            });

            if (!item) {
                return NextResponse.json({ error: 'eSIM not found' }, { status: 404 });
            }

            const totalMB = item.totalData ?? 0;
            const usedMB = item.dataUsage ?? 0;
            const remainingMB = Math.max(0, totalMB - usedMB);

            return NextResponse.json({
                iccid,
                totalData: Number((totalMB / 1024).toFixed(2)),
                remainingData: Number((remainingMB / 1024).toFixed(2)),
                status: item.activationStatus || 'unknown',
                expiryDate: null,
                source: 'database'
            });
        }

        // Parse eSIM Access API response
        // eSIM Access returns usage in bytes, convert to GB
        const bundles = usageData?.packageList || usageData?.bundles || [];
        let totalBytes = 0;
        let remainingBytes = 0;
        let status = 'unknown';
        let expiryDate = null;

        if (bundles.length > 0) {
            for (const bundle of bundles) {
                // eSIM Access format: totalVolume, usedVolume in bytes
                const bundleTotal = bundle.totalVolume || bundle.volume || bundle.initialQuantity || 0;
                const bundleUsed = bundle.usedVolume || bundle.usageVolume || 0;
                totalBytes += bundleTotal;
                remainingBytes += (bundleTotal - bundleUsed);
                
                // Get status from first active bundle
                if (bundle.status === 'ACTIVE' || bundle.status === 'active' || bundle.status === 1) {
                    status = 'active';
                }
                
                // Get expiry date
                if (bundle.expiredTime || bundle.expiryDate || bundle.endDate) {
                    const exp = bundle.expiredTime || bundle.expiryDate || bundle.endDate;
                    // Handle both timestamp and ISO string
                    expiryDate = typeof exp === 'number' ? new Date(exp).toISOString() : exp;
                }
            }
        }

        // Also check esimDetails for status
        if (esimDetails) {
            const esimStatus = esimDetails.esimStatus || esimDetails.status;
            if (esimStatus === 'INSTALLED' || esimStatus === 'IN_USE' || esimStatus === 'ACTIVE') {
                status = 'active';
            } else if (esimStatus === 'AVAILABLE' || esimStatus === 'READY') {
                status = 'queued';
            } else if (esimStatus === 'EXPIRED' || esimStatus === 'DISABLED') {
                status = 'expired';
            }
        }

        // Convert bytes to GB
        const totalGB = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
        const remainingGB = Number((remainingBytes / (1024 * 1024 * 1024)).toFixed(2));

        return NextResponse.json({
            iccid,
            totalData: totalGB,
            remainingData: remainingGB > 0 ? remainingGB : totalGB, // If no usage yet, show full
            status,
            expiryDate,
            source: 'esim-access-api',
            raw: process.env.NODE_ENV === 'development' ? { esimDetails, usageData } : undefined
        });

    } catch (error) {
        console.error('Usage check failed:', error);
        return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }
}
