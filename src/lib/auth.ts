import { NextResponse } from 'next/server';

export function verifyAuth(request: Request): boolean {
    const authHeader = request.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        console.error('ADMIN_PASSWORD is not set in environment variables.');
        return false;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false; // Or handle as malformed
    }

    const token = authHeader.split(' ')[1];

    // Constant time comparison recommended for production security (timing attack prevention)
    // but for now simple comparison is infinitely better than nothing.
    return token === adminPassword;
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
