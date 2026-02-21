'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentType = 'essential' | 'analytics' | 'marketing';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  consentDate: string;
  consentId?: string;
}

interface CookieConsentProps {
  isEU?: boolean;
}

export default function CookieConsent({ isEU = true }: CookieConsentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
    consentDate: '',
  });

  useEffect(() => {
    // Only show banner for EU visitors
    if (!isEU) {
      return;
    }

    // Check if user already gave consent
    const stored = localStorage.getItem('cookie_consent');
    if (!stored) {
      setIsOpen(true);
    } else {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        setIsOpen(true);
      }
    }
  }, [isEU]);

  const handleAcceptAll = async () => {
    const newPrefs: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      consentDate: new Date().toISOString(),
      consentId: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    localStorage.setItem('cookie_consent', JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    console.log('[COMPLIANCE] User accepted all cookies', newPrefs);
    setIsOpen(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const newPrefs: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      consentDate: new Date().toISOString(),
      consentId: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    localStorage.setItem('cookie_consent', JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    console.log('[COMPLIANCE] User rejected non-essential cookies', newPrefs);
    setIsOpen(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    const prefs = {
      ...preferences,
      consentDate: new Date().toISOString(),
      consentId: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    setPreferences(prefs);
    console.log('[COMPLIANCE] User saved custom preferences', prefs);
    setIsOpen(false);
    setShowSettings(false);
  };

  const handleWithdrawConsent = () => {
    localStorage.removeItem('cookie_consent');
    setPreferences({ essential: true, analytics: false, marketing: false, timestamp: 0, consentDate: '' });
    setIsOpen(true);
    console.log('[COMPLIANCE] User withdrew consent');
  };

  const togglePreference = (type: ConsentType) => {
    if (type === 'essential') return; // Essential cannot be toggled
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <>
      {isEU && (
        <>
          <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full bg-white rounded-[2rem] shadow-2xl border border-black/10 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
            {!showSettings ? (
              // Main Banner
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <h3 className="font-black text-lg tracking-tight">🍪 Cookie & Datenschutz</h3>
                    <p className="text-sm text-black/60 font-bold leading-relaxed">
                      Wir nutzen Cookies für Funktionalität, Analyse und Marketing. Essenzielle Cookies sind notwendig. 
                      Erfahren Sie mehr in unserer{' '}
                      <Link href="/de/datenschutz" className="underline hover:opacity-70">
                        Datenschutzerklärung
                      </Link>
                      .
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 font-bold text-sm transition-colors"
                  >
                    Ablehnen
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>Einstellungen</span>
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 rounded-lg bg-black text-white font-bold text-sm hover:bg-black/80 transition-colors col-span-2 md:col-span-1"
                  >
                    Alle akzeptieren
                  </button>
                </div>
              </div>
            ) : (
              // Settings Panel
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg tracking-tight">Cookie-Einstellungen</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 border-t border-black/5 pt-6">
                  {/* Essential */}
                  <div className="flex items-center justify-between p-4 bg-black/5 rounded-lg">
                    <div>
                      <p className="font-black text-sm">Essenzielle Cookies</p>
                      <p className="text-[10px] text-black/40 font-bold">Notwendig für die Website-Funktion</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.essential}
                      disabled
                      className="w-5 h-5 rounded cursor-not-allowed"
                    />
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg hover:bg-black/2 transition-colors">
                    <div>
                      <p className="font-black text-sm">Analytics-Cookies</p>
                      <p className="text-[10px] text-black/40 font-bold">Helfen uns, die Website zu verbessern</p>
                    </div>
                    <button
                      onClick={() => togglePreference('analytics')}
                      className="relative w-12 h-6 bg-black/20 rounded-full transition-colors"
                    >
                      <motion.div
                        animate={{ x: preferences.analytics ? 24 : 2 }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>

                  {/* Marketing */}
                  <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg hover:bg-black/2 transition-colors">
                    <div>
                      <p className="font-black text-sm">Marketing-Cookies</p>
                      <p className="text-[10px] text-black/40 font-bold">Für personalisierte Werbung</p>
                    </div>
                    <button
                      onClick={() => togglePreference('marketing')}
                      className="relative w-12 h-6 bg-black/20 rounded-full transition-colors"
                    >
                      <motion.div
                        animate={{ x: preferences.marketing ? 24 : 2 }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-black/5">
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 font-bold text-sm transition-colors"
                  >
                    Ablehnen
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-bold text-sm hover:bg-black/80 transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Consent Link - Accessible */}
      {isEU && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleWithdrawConsent}
            className="text-[9px] font-bold text-black/30 hover:text-black/70 transition-colors underline decoration-dotted"
            title="Ihre Cookie-Einwilligung zurückziehen"
          >
            Cookie-Einstellung
          </button>
        </div>
      )}
        </>
      )}
    </>
  );
}
