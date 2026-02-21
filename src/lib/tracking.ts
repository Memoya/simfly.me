/**
 * Privacy-First Conversion Tracking
 * Lightweight event logger for Simfly.me
 * Only logs analytics if user has given consent
 */

import { EventType } from "@/types";

function hasAnalyticsConsent(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const stored = localStorage.getItem('cookie_consent');
        if (!stored) return false;
        const consent = JSON.parse(stored);
        return consent.analytics === true;
    } catch (e) {
        return false;
    }
}

export const trackEvent = (type: EventType, metadata?: Record<string, unknown>) => {
    // Only track if analytics consent is given
    if (!hasAnalyticsConsent()) return;

    // In production, send to a privacy-friendly provider like Plausible or a custom internal endpoint
    const timestamp = new Date().toISOString();

    console.log(`[TRACKING] [${timestamp}] ${type}`, metadata || '');

    // Example Integration:
    if (typeof window !== 'undefined' && (window as unknown as Window & { plausible?: (event: string, options: { props: Record<string, unknown> }) => void }).plausible) {
        (window as unknown as Window & { plausible: (event: string, options: { props: Record<string, unknown> }) => void }).plausible(type, { props: metadata || {} });
    }
};

// Hook for automatic page view tracking could be added here
