import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const body = await request.json();
    const { iccid, bundle } = body;

    if (!iccid || !bundle) return NextResponse.json({ error: 'ICCID and bundle required' }, { status: 400 });

    try {
        const provider = getProvider('esim-access');
        if (!provider?.topUp) {
            return NextResponse.json({ error: 'Provider does not support top-up' }, { status: 501 });
        }

        const result = await provider.topUp(iccid, bundle);
        if (result.success) {
            return NextResponse.json({ success: true, data: result });
        }

        return NextResponse.json({ error: result.error || 'Top-up failed' }, { status: 500 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
