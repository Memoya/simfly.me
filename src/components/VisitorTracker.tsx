'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
    const pathname = usePathname();
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
                        lang: pathname.split('/')[1] || 'de',
                        screenWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
                        screenHeight: typeof window !== 'undefined' ? window.innerHeight : undefined
                    }),
                });
            } catch (err) {
                // Silently fail to not disturb user
            }
        };

        // Debounce tracking to prevent excessive API calls on rapid navigation
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(track, 300);

        // Keep session alive every 5 minutes if they stay on page
        const interval = setInterval(track, 5 * 60 * 1000);
        return () => {
            clearInterval(interval);
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [pathname]);

    return null;
}
