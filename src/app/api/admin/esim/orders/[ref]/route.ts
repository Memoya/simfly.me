import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getEsimOrder } from '@/lib/esim';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ ref: string }> }) {
    if (!verifyAuth(request)) return unauthorizedResponse();

    const { ref } = await params;

    if (!ref) {
        return NextResponse.json({ error: 'Order reference required' }, { status: 400 });
    }

    const order = await getEsimOrder(ref);

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
}
