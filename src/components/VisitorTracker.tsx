'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Generate a stable session ID for this browser tab/window session
        let sessionId = sessionStorage.getItem('simfly_visitor_session');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('simfly_visitor_session', sessionId);
        }

        const track = async () => {
            try {
                await fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        page: pathname,
                        lang: pathname.split('/')[1] || 'de'
                    }),
                });
            } catch (err) {
                // Silently fail to not disturb user
            }
        };

        track();

        // Keep session alive every 5 minutes if they stay on page
        const interval = setInterval(track, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
