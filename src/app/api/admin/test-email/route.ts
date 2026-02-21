import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
    if (!verifyAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';

    console.log('[TEST-EMAIL] Testing email to:', testEmail);

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'Simfly <onboarding@resend.dev>',
                to: testEmail,
                subject: 'Test Email - Simfly.me',
                html: '<h1>✅ Test erfolgreich!</h1><p>Wenn Sie diese Email erhalten, funktioniert der Email-Service korrekt.</p>'
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('[TEST-EMAIL] Error:', data);
            return NextResponse.json({ 
                success: false, 
                error: data.message || 'Unknown error',
                details: data,
                possibleCauses: [
                    'Domain bestellung@simfly.me ist nicht in Resend verifiziert',
                    'RESEND_API_KEY ist ungültig oder abgelaufen',
                    'Resend Account hat ein Problem'
                ]
            }, { status: 400 });
        }

        console.log('[TEST-EMAIL] Success! Email ID:', data.id);
        return NextResponse.json({ 
            success: true, 
            emailId: data.id,
            message: 'Email wurde erfolgreich versendet!'
        });

    } catch (error: any) {
        console.error('[TEST-EMAIL] Exception:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
