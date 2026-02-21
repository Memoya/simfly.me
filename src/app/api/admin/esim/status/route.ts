import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const iccid = searchParams.get('iccid');

    if (!iccid) return NextResponse.json({ error: 'ICCID required' }, { status: 400 });

    const provider = getProvider('esim-access');
    if (!provider?.getEsimDetails) {
        return NextResponse.json({ error: 'Provider does not support status lookup' }, { status: 501 });
    }

    const status = await provider.getEsimDetails(iccid);
    return NextResponse.json(status || { error: 'No data' });
}
