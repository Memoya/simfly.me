/**
 * Privacy-First Conversion Tracking
 * Lightweight event logger for Simfly.me
 */

import { EventType } from "@/types";

export const trackEvent = (type: EventType, metadata?: Record<string, unknown>) => {
    // In production, send to a privacy-friendly provider like Plausible or a custom internal endpoint
    const timestamp = new Date().toISOString();

    console.log(`[TRACKING] [${timestamp}] ${type}`, metadata || '');

    // Example Integration:
    if (typeof window !== 'undefined' && (window as unknown as Window & { plausible?: (event: string, options: { props: Record<string, unknown> }) => void }).plausible) {
        (window as unknown as Window & { plausible: (event: string, options: { props: Record<string, unknown> }) => void }).plausible(type, { props: metadata || {} });
    }
};

// Hook for automatic page view tracking could be added here
