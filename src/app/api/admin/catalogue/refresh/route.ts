import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
    try {
        // Dynamic import to avoid build-time side effects
        const { updateCatalogue } = await import('@/lib/catalogue');
        const result = await updateCatalogue();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to refresh catalogue:', error);
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}
