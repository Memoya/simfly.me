import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        if (!verifyAuth(request)) {
            return unauthorizedResponse();
        }

        const apiKey = process.env.ESIM_GO_API_KEY;

        if (!apiKey || apiKey === 'mock_esim_key') {
            return NextResponse.json({ balance: 250.00, currency: 'USD', mock: true });
        }

        try {
            const res = await fetch('https://api.esim-go.com/v2.2/balance', {
                headers: { 'X-API-Key': apiKey }
            });

            if (!res.ok) throw new Error('Failed to fetch balance');

            const data = await res.json();
            return NextResponse.json({
                balance: data.balance || 0,
                currency: data.currency || 'USD'
            });
        } catch (error) {
            return NextResponse.json({ balance: 0, currency: 'USD', error: 'Failed to fetch' }, { status: 500 });
        }
    } catch (outerError) {
        console.error('Critical error in balance route:', outerError);
        return NextResponse.json({ error: 'Critical Error' }, { status: 500 });
    }
}
