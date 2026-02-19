import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { applyBundle } from '@/lib/esim';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const body = await request.json();
    const { iccid, bundle } = body;

    if (!iccid || !bundle) return NextResponse.json({ error: 'ICCID and bundle required' }, { status: 400 });

    try {
        const result = await applyBundle(iccid, bundle);
        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
