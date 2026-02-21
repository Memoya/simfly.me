import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const provider = getProvider('esim-access');
    if (!provider) {
        return NextResponse.json({ error: 'Provider not configured' }, { status: 500 });
    }

    const products = await provider.fetchCatalog();
    const sample = products[0] || null;
    const raw = sample?.originalData || null;
    const rawKeys = raw && typeof raw === 'object' ? Object.keys(raw) : [];

    return NextResponse.json({
        count: products.length,
        normalizedKeys: sample ? Object.keys(sample) : [],
        rawKeys,
        rawSample: raw
    });
}
