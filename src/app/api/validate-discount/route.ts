import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Code erforderlich' }, { status: 400 });
        }

        const settings = await getSettings();
        const discountCodes = settings.discountCodes || [];
        
        const discount = discountCodes.find(
            (d: any) => d.code?.toUpperCase() === code.toUpperCase() && d.active
        );

        if (!discount) {
            return NextResponse.json({ valid: false, error: 'Ungültiger oder abgelaufener Code' });
        }

        return NextResponse.json({
            valid: true,
            code: discount.code,
            type: discount.type, // 'percent' or 'fixed'
            value: discount.value
        });

    } catch (error) {
        console.error('Discount validation error:', error);
        return NextResponse.json({ valid: false, error: 'Fehler beim Prüfen' }, { status: 500 });
    }
}
