import { useEffect, useState } from 'react';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export function useConsentPreferences() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch (e) {
        setConsent(null);
      }
    }
  }, []);

  return {
    hasAnalyticsConsent: consent?.analytics ?? false,
    hasMarketingConsent: consent?.marketing ?? false,
    hasEssentialConsent: consent?.essential ?? true,
    allConsent: consent,
  };
}
