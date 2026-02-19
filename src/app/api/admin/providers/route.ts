
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!verifyAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const defaultProviders = [
            { name: 'eSIM Go', slug: 'esim-go', priority: 100 },
            { name: 'Airalo', slug: 'airalo', priority: 90 },
            { name: 'eSIMAccess', slug: 'esim-access', priority: 80 },
        ];

        // Ensure default providers exist
        for (const p of defaultProviders) {
            await prisma.provider.upsert({
                where: { slug: p.slug },
                update: {},
                create: {
                    name: p.name,
                    slug: p.slug,
                    priority: p.priority,
                    isActive: true,
                    reliabilityScore: 1.0,
                    config: p.slug === 'esim-access' ? {
                        accessCode: 'ddf262332cdd43b6b1a85ae56dc78261',
                        secretKey: '1e08f66c25f44cea93af1070a07a623c',
                        baseUrl: 'https://api.esimaccess.com/api/v1'
                    } : undefined
                }
            });
        }

        // Deactivate all others that are not in the new restricted set
        const allowedSlugs = defaultProviders.map(p => p.slug);
        await prisma.provider.updateMany({
            where: {
                slug: { notIn: allowedSlugs }
            },
            data: {
                isActive: false
            }
        });

        const providers = await prisma.provider.findMany({
            where: {
                slug: { in: allowedSlugs }
            },
            orderBy: { priority: 'desc' },
            include: {
                _count: {
                    select: { products: true, orders: true }
                }
            }
        });

        return NextResponse.json(providers);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    if (!verifyAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, isActive, priority, reliabilityScore, config } = body;

        if (!id) throw new Error('ID missing');

        const current = await prisma.provider.findUnique({ where: { id } });
        if (!current) throw new Error('Provider not found');

        const updated = await prisma.provider.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : undefined,
                priority: priority !== undefined ? Number(priority) : undefined,
                reliabilityScore: reliabilityScore !== undefined ? Number(reliabilityScore) : undefined,
                config: config !== undefined ? config : undefined,
            }
        });

        // ENTERPRISE AUDIT LOG
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_PROVIDER',
                entity: `Provider: ${updated.slug}`,
                userId: 'Admin',
                details: JSON.stringify({
                    before: { isActive: current.isActive, priority: current.priority, reliability: current.reliabilityScore, config: current.config },
                    after: { isActive: updated.isActive, priority: updated.priority, reliability: updated.reliabilityScore, config: updated.config }
                })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
