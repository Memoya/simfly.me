import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        try {
            const { getProvider } = await import('@/lib/providers');
            const provider = getProvider('esim-access');

            if (!provider) {
                return NextResponse.json({ error: 'Provider not configured' }, { status: 500 });
            }

            const balance = await provider.getBalance();
            return NextResponse.json({
                balance,
                currency: 'USD'
            });
        } catch (error) {
            return NextResponse.json({ balance: 0, currency: 'USD', error: 'Failed to fetch' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in balance route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
