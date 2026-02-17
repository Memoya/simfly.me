'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'EUR' | 'USD' | 'TRY' | 'JPY' | 'CNY' | 'RUB' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'KRW' | 'THB' | 'INR';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    formatPrice: (amountInEur: number) => string;
    convertPrice: (amountInEur: number) => number;
    symbol: string;
}

// Exchange rates gegen EUR als Basis (Stand: ungefähre Werte)
const RATES: Record<Currency, number> = {
    EUR: 1,
    USD: 1.10,    // 1 EUR = 1.10 USD
    TRY: 36.50,   // 1 EUR = 36.50 TRY
    JPY: 163.00,  // 1 EUR = 163 JPY
    CNY: 7.85,    // 1 EUR = 7.85 CNY
    RUB: 100.00,  // 1 EUR = 100 RUB (approximate)
    SEK: 11.45,   // 1 EUR = 11.45 SEK
    NOK: 11.75,   // 1 EUR = 11.75 NOK
    DKK: 7.46,    // 1 EUR = 7.46 DKK
    PLN: 4.30,    // 1 EUR = 4.30 PLN
    CZK: 25.00,   // 1 EUR = 25 CZK
    HUF: 400.00,  // 1 EUR = 400 HUF
    RON: 4.97,    // 1 EUR = 4.97 RON
    KRW: 1485.00, // 1 EUR = 1485 KRW
    THB: 38.50,   // 1 EUR = 38.50 THB
    INR: 92.00    // 1 EUR = 92 INR
};

const SYMBOLS: Record<Currency, string> = {
    EUR: '€',
    USD: '$',
    TRY: '₺',
    JPY: '¥',
    CNY: '¥',
    RUB: '₽',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    RON: 'lei',
    KRW: '₩',
    THB: '฿',
    INR: '₹'
};

// Mapping von Locale zu Standard-Währung
export const LOCALE_TO_CURRENCY: Record<string, Currency> = {
    de: 'EUR', en: 'USD', es: 'EUR', fr: 'EUR', it: 'EUR',
    tr: 'TRY', pt: 'EUR', nl: 'EUR', ja: 'JPY', zh: 'CNY',
    el: 'EUR', ru: 'RUB', sv: 'SEK', no: 'NOK', da: 'DKK',
    fi: 'EUR', pl: 'PLN', cs: 'CZK', hu: 'HUF', ro: 'RON',
    ko: 'KRW', th: 'THB', hi: 'INR'
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({
    children,
    defaultCurrency = 'EUR'
}: {
    children: React.ReactNode,
    defaultCurrency?: Currency
}) {
    const [currency, setCurrency] = useState<Currency>(defaultCurrency);

    // Sync with defaultCurrency if it changes (e.g. navigation /de -> /en)
    useEffect(() => {
        setCurrency(defaultCurrency);
    }, [defaultCurrency]);

    const convertPrice = (amountInEur: number) => {
        return amountInEur * RATES[currency];
    };

    const formatPrice = (amountInEur: number) => {
        const converted = convertPrice(amountInEur);

        // Map currencies to appropriate locales for formatting
        const localeMap: Record<Currency, string> = {
            EUR: 'de-DE', USD: 'en-US', TRY: 'tr-TR', JPY: 'ja-JP', CNY: 'zh-CN',
            RUB: 'ru-RU', SEK: 'sv-SE', NOK: 'no-NO', DKK: 'da-DK', PLN: 'pl-PL',
            CZK: 'cs-CZ', HUF: 'hu-HU', RON: 'ro-RO', KRW: 'ko-KR', THB: 'th-TH',
            INR: 'hi-IN'
        };

        return new Intl.NumberFormat(localeMap[currency], {
            style: 'currency',
            currency: currency
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            formatPrice,
            convertPrice,
            symbol: SYMBOLS[currency]
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
