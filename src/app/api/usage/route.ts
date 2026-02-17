import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const iccid = searchParams.get('iccid');

    if (!iccid) {
        return NextResponse.json({ error: 'ICCID is required' }, { status: 400 });
    }

    const API_KEY = process.env.ESIM_GO_API_KEY;
    const isMock = !API_KEY || API_KEY === 'mock_esim_key';

    if (isMock) {
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
        // Check active bundles on the eSIM
        const res = await fetch(`https://api.esim-go.com/v2.2/esims/${iccid}/bundles`, {
            headers: { 'X-API-Key': API_KEY! }
        });

        if (!res.ok) {
            if (res.status === 404) {
                return NextResponse.json({ error: 'eSIM not found' }, { status: 404 });
            }
            throw new Error(`eSIM-Go API error: ${res.status}`);
        }

        const data = await res.json();

        // Calculate totals from active bundles
        let totalBytes = 0;
        let remainingBytes = 0;
        let expiryDate: string | null = null;
        let status = 'expired';

        if (data.bundles && data.bundles.length > 0) {
            // Find the most relevant active bundle
            const activeBundle = data.bundles.find((b: any) =>
                b.assignments?.some((a: any) => a.status === 'active')
            );

            if (activeBundle) {
                status = 'active';
                const assignment = activeBundle.assignments.find((a: any) => a.status === 'active');
                if (assignment) {
                    totalBytes = assignment.initialQuantity;
                    remainingBytes = assignment.remainingQuantity;
                    expiryDate = assignment.endTime || null;
                }
            } else {
                // Check if there are queued bundles or just expired
                status = data.bundles.some((b: any) => b.assignments?.some((a: any) => a.status === 'queued')) ? 'queued' : 'expired';
            }
        } else {
            status = 'inactive';
        }

        return NextResponse.json({
            iccid,
            totalData: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2)),
            remainingData: Number((remainingBytes / (1024 * 1024 * 1024)).toFixed(2)),
            status,
            expiryDate,
            raw: data // Keep raw data for advanced debugging if needed
        });

    } catch (error) {
        console.error('Usage check failed:', error);
        return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }
}
