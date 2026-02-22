import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const adminPassword = process.env.ADMIN_PASSWORD;

    return NextResponse.json({
        environment: process.env.NODE_ENV,
        hasAdminPassword: !!adminPassword,
        adminPasswordLength: adminPassword?.length || 0,
        adminPasswordFirstChar: adminPassword?.charAt(0) || 'N/A',
        adminPasswordLastChar: adminPassword?.charAt(adminPassword.length - 1) || 'N/A',
        passwordHash: adminPassword ? Buffer.from(adminPassword).toString('base64').substring(0, 20) : 'N/A',
        // Be careful! Don't expose full password
        warning: 'This endpoint is for debugging only - should be removed in production!'
    });
}
