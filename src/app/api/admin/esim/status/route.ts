import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getEsimDetails } from '@/lib/esim';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const iccid = searchParams.get('iccid');

    if (!iccid) return NextResponse.json({ error: 'ICCID required' }, { status: 400 });

    const status = await getEsimDetails(iccid);
    return NextResponse.json(status);
}
