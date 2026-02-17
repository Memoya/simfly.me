'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { i18n, type Locale } from '@/i18n-config';
import { useCurrency } from '@/context/CurrencyContext';
import type { Currency } from '@/context/CurrencyContext';

// Language metadata with native names and flags
const LANGUAGE_INFO: Record<Locale, { native: string; flag: string }> = {
    de: { native: 'Deutsch', flag: '🇩🇪' },
    en: { native: 'English', flag: '🇺🇸' },
    es: { native: 'Español', flag: '🇪🇸' },
    fr: { native: 'Français', flag: '🇫🇷' },
    it: { native: 'Italiano', flag: '🇮🇹' },
    tr: { native: 'Türkçe', flag: '🇹🇷' },
    pt: { native: 'Português', flag: '🇵🇹' },
    nl: { native: 'Nederlands', flag: '🇳🇱' },
    ja: { native: '日本語', flag: '🇯🇵' },
    zh: { native: '中文', flag: '🇨🇳' },
    el: { native: 'Ελληνικά', flag: '🇬🇷' },
    ru: { native: 'Русский', flag: '🇷🇺' },
    sv: { native: 'Svenska', flag: '🇸🇪' },
    no: { native: 'Norsk', flag: '🇳🇴' },
    da: { native: 'Dansk', flag: '🇩🇰' },
    fi: { native: 'Suomi', flag: '🇫🇮' },
    pl: { native: 'Polski', flag: '🇵🇱' },
    cs: { native: 'Čeština', flag: '🇨🇿' },
    hu: { native: 'Magyar', flag: '🇭🇺' },
    ro: { native: 'Română', flag: '🇷🇴' },
    ko: { native: '한국어', flag: '🇰🇷' },
    th: { native: 'ไทย', flag: '🇹🇭' },
    hi: { native: 'हिंदी', flag: '🇮🇳' },
};

// Priority languages (shown immediately)
const PRIORITY_LANGS: Locale[] = ['de', 'en', 'es', 'fr', 'it', 'tr', 'pt', 'nl', 'ja', 'zh'];

// More languages (expandable)
const MORE_LANGS: Locale[] = ['el', 'ru', 'sv', 'no', 'da', 'fi', 'pl', 'cs', 'hu', 'ro', 'ko', 'th', 'hi'];

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
    EUR: '€', USD: '$', TRY: '₺', JPY: '¥', CNY: '¥', RUB: '₽',
    SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł', CZK: 'Kč',
    HUF: 'Ft', RON: 'lei', KRW: '₩', THB: '฿', INR: '₹'
};

export default function LanguageCurrencySelector() {
    const pathname = usePathname();
    const router = useRouter();
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const [showMoreLanguages, setShowMoreLanguages] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get current language from pathname
    const currentLang = (pathname?.split('/')[1] as Locale) || 'de';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowMoreLanguages(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchLanguage = (newLang: Locale) => {
        const segments = pathname?.split('/') || [];
        segments[1] = newLang;
        router.push(segments.join('/'));
        setIsOpen(false);
        setShowMoreLanguages(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white/80 backdrop-blur-sm"
            >
                <span className="text-lg">{LANGUAGE_INFO[currentLang]?.flag || '🌍'}</span>
                <span className="hidden sm:inline text-sm font-medium">
                    {LANGUAGE_INFO[currentLang]?.native || currentLang.toUpperCase()}
                </span>
                <span className="text-sm font-medium">{CURRENCY_SYMBOLS[currency] || currency}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                    {/* Currency Selector */}
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Currency</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(['EUR', 'USD', 'TRY', 'JPY', 'CNY'] as const).map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => setCurrency(curr as Currency)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${currency === curr
                                            ? 'bg-blue-600 text-white font-medium shadow-md'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {CURRENCY_SYMBOLS[curr]} {curr}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority Languages */}
                    <div className="max-h-64 overflow-y-auto">
                        <div className="p-2">
                            <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Languages</p>
                            {PRIORITY_LANGS.map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => switchLanguage(lang)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentLang === lang
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <span className="text-xl">{LANGUAGE_INFO[lang].flag}</span>
                                    <span className="text-sm">{LANGUAGE_INFO[lang].native}</span>
                                    {currentLang === lang && (
                                        <span className="ml-auto text-blue-600">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* More Languages Toggle */}
                        <div className="px-2 pb-2">
                            <button
                                onClick={() => setShowMoreLanguages(!showMoreLanguages)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 border-t border-gray-100 mt-1 pt-3"
                            >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <span>🌍</span>
                                    More Languages
                                </span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${showMoreLanguages ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* More Languages List */}
                            {showMoreLanguages && (
                                <div className="mt-2 animate-fadeIn">
                                    {MORE_LANGS.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => switchLanguage(lang)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentLang === lang
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <span className="text-xl">{LANGUAGE_INFO[lang].flag}</span>
                                            <span className="text-sm">{LANGUAGE_INFO[lang].native}</span>
                                            {currentLang === lang && (
                                                <span className="ml-auto text-blue-600">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
