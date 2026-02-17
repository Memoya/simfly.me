import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prisma } = await import('@/lib/prisma');

        const payload = await request.json();
        const { type, data } = payload;

        console.log(`[WEBHOOK-RESEND] Event: ${type}`);

        if (type === 'email.delivered' || type === 'email.bounced') {
            const emailId = data.email_id;
            const status = type === 'email.delivered' ? 'DELIVERED' : 'BOUNCED';

            if (!emailId) {
                return NextResponse.json({ received: true });
            }

            console.log(`[WEBHOOK-RESEND] Email ${emailId} status: ${status}`);

            const providerSyncs = await prisma.providerSync.findMany({
                where: {
                    resendMessageId: {
                        contains: emailId
                    }
                }
            });

            for (const sync of providerSyncs) {
                await prisma.providerSync.update({
                    where: { id: sync.id },
                    data: {
                        emailStatus: status
                    }
                });
                console.log(`[WEBHOOK-RESEND] Updated Sync ID: ${sync.id} to ${status}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[WEBHOOK-RESEND] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
