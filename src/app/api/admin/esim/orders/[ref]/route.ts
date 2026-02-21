import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ ref: string }> }) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const { ref } = await params;

    if (!ref) {
        return NextResponse.json({ error: 'Order reference required' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Provider order lookup is not supported for eSIMAccess' }, { status: 501 });
}
