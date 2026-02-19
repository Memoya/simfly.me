import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { listEsimOrders, createAdminOrder } from '@/lib/esim';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const result = await listEsimOrders(page, perPage);
    return NextResponse.json(result);
}

export async function POST(request: Request) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    try {
        const payload = await request.json();
        const result = await createAdminOrder(payload);

        if (result.success) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
