
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { getProvider } from '@/lib/providers';

export async function GET(request: Request) {
    if (!verifyAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    try {
        const providerData = (await prisma.provider.findUnique({
            where: { id }
        })) as any;

        if (!providerData) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        const engine = getProvider(providerData.slug);
        if (!engine) {
            return NextResponse.json({ error: 'Provider engine not found' }, { status: 404 });
        }

        // We temporarily inject the config into the engine if it has one
        const config = providerData.config;
        if (config) {
            (engine as any).config = config;
            // Also update API keys if provided in config
            if (config.apiKey) {
                (engine as any).apiKey = config.apiKey;
            }
        }

        const [balance, health] = await Promise.allSettled([
            engine.getBalance(),
            engine.checkHealth()
        ]);

        return NextResponse.json({
            id,
            balance: balance.status === 'fulfilled' ? balance.value : 0,
            health: health.status === 'fulfilled' ? health.value : false,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
