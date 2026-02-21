import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    return NextResponse.json({ error: 'Listing provider orders is not supported for eSIMAccess' }, { status: 501 });
}

export async function POST(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    return NextResponse.json({ error: 'Admin order creation is not supported for eSIMAccess' }, { status: 501 });
}
