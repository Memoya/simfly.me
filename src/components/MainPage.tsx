'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Globe, Smartphone, ChevronRight, ShoppingBag, X, Check, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import CartSidebar from '@/components/CartSidebar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import CompatibilityCheck from '@/components/CompatibilityCheck';
import { trackEvent } from '@/lib/tracking';
import { getCountryFlagUrl } from '@/lib/flags';
import PackageModal from '@/components/PackageModal';
import { matchesSearchTerm } from '@/lib/countries';
import { Product, CountryGroup, AdminSettings } from '@/types';
import GlobeComponent from '@/components/Globe';
import { useCurrency } from '@/context/CurrencyContext';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';

const popularCountriesList = [
  'Thailand', 'United States', 'Turkey', 'Japan',
  'Germany', 'Spain', 'France', 'Italy',
  'United Kingdom', 'Greece', 'Switzerland', 'Vietnam'
];

// Featured deals configuration
const FEATURED_DEALS = [
  { id: 'static_1', country: 'Thailand', data: '10 GB', days: 15, price: 10.99, iso: 'th', region: 'Asia', productId: undefined },
  { id: 'static_2', country: 'United States', data: '10 GB', days: 30, price: 14.99, iso: 'us', region: 'Americas', productId: undefined },
  { id: 'static_3', country: 'Turkey', data: '5 GB', days: 30, price: 8.99, iso: 'tr', region: 'Europe', productId: undefined },
  { id: 'static_4', country: 'Japan', data: 'Unlimited', days: 7, price: 19.99, iso: 'jp', region: 'Asia', productId: undefined },
  { id: 'static_5', country: 'Vietnam', data: '10 GB', days: 30, price: 12.99, iso: 'vn', region: 'Asia', productId: undefined },
  { id: 'static_6', country: 'Switzerland', data: '3 GB', days: 30, price: 9.99, iso: 'ch', region: 'Europe', productId: undefined },
  { id: 'static_7', country: 'United Arab Emirates', data: '5 GB', days: 30, price: 18.99, iso: 'ae', region: 'Asia', productId: undefined }
];

const INITIAL_FAQS = [
  { question: 'Wie funktioniert die Aktivierung?', answer: 'Nach dem Kauf erhältst du einen QR-Code per E-Mail. Scanne diesen einfach in den Einstellungen deines Handys unter "Mobilfunk" ein. Die eSIM ist sofort aktiv.' },
  { question: 'Wann beginnen die Tage zu zählen?', answer: 'Die Laufzeit startet erst, wenn sich die eSIM zum ersten Mal mit einem unterstützten Netzwerk im Zielland verbindet.' },
  { question: 'Kann ich mein WhatsApp behalten?', answer: 'Ja! Deine physische SIM bleibt aktiv oder kann deaktiviert werden. Deine WhatsApp-Nummer bleibt unverändert.' },
  { question: 'Ist mein Handy kompatibel?', answer: 'Die meisten Smartphones ab Baujahr 2019 (iPhone 11+, Google Pixel 3+, Samsung S20+) unterstützen eSIM. Nutze unseren Check oben für Details.' }
];

interface Dictionary {
  nav: Record<string, string>;
  hero: Record<string, string>;
  featured: Record<string, string>;
  destinations: Record<string, string>;
  steps: Record<string, string>;
  faq: Record<string, string>;
  ui: {
    continents: Record<string, string>;
    common: Record<string, string>;
    cart: Record<string, string>;
    compatibility: Record<string, string>;
    defaultFaqs: { question: string, answer: string }[];
  };
  footer: Record<string, string>;
  check: Record<string, string>;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export default function Home({ dictionary, lang }: { dictionary: Dictionary, lang: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const { items, openCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetch('/api/admin/settings').then(res => res.json()).then(data => setSettings(data)).catch(err => console.error(err));
  }, []);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const fetchCatalogue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/catalogue?region=');
      if (!res.ok) throw new Error('Katalog konnte nicht geladen werden');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data as Product[]);
      } else {
        throw new Error('Ungültiges Datenformat');
      }
    } catch (error: unknown) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchCatalogue();
    trackEvent('VIEW_CATALOGUE');
  }, [fetchCatalogue]);

  // Group products by country
  const countriesMap = useMemo(() => {
    const map: Record<string, CountryGroup> = {};
    products.forEach((p) => {
      if (!map[p.region]) {
        map[p.region] = {
          country: p.region,
          iso: p.iso || '',
          packages: [],
          minPrice: p.price,
          regionGroup: p.regionGroup,
        };
      }
      map[p.region].packages.push(p);
      if (p.price < map[p.region].minPrice) {
        map[p.region].minPrice = p.price;
      }
    });
    return map;
  }, [products]);

  const allCountries = useMemo(() => Object.values(countriesMap), [countriesMap]);

  const regions = useMemo(() =>
    ['All', ...Array.from(new Set(allCountries.map((c) => c.regionGroup || 'Other'))).sort()],
    [allCountries]
  );

  const filteredCountries = useMemo(() => {
    return allCountries.filter((country) => {
      const matchesRegion = selectedRegion === 'All' || country.regionGroup === selectedRegion;
      const matchesSearch = searchTerm === '' ||
        matchesSearchTerm(country.country, searchTerm) ||
        (country.iso && country.iso.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesRegion && matchesSearch;
    });
  }, [allCountries, selectedRegion, searchTerm]);

  const sortedCountries = useMemo(() => {
    const sorted = [...filteredCountries].sort((a, b) =>
      a.country.localeCompare(b.country, 'de')
    );

    if (!showAllCountries && searchTerm === '' && selectedRegion === 'All') {
      return sorted.filter((c: CountryGroup) => popularCountriesList.includes(c.country));
    }

    return sorted;
  }, [filteredCountries, showAllCountries, searchTerm, selectedRegion]);

  const displayedCountries = sortedCountries.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-electric/20 selection:text-navy">
      <PackageModal
        country={selectedCountry?.country || ''}
        iso={selectedCountry?.iso || ''}
        packages={selectedCountry?.packages || []}
        isOpen={!!selectedCountry}
        onClose={() => {
          setSelectedCountry(null);
          setSelectedPackage(null);
        }}
        initialPackage={selectedPackage}
      />

      {/* Enhanced Navbar */}
      {settings?.banner?.active && (
        <div className="bg-electric text-white px-4 py-2 text-center text-sm font-bold tracking-wide relative z-50">
          {settings.banner.link ? (
            <Link href={settings.banner.link} className="hover:underline">
              {settings.banner.text}
            </Link>
          ) : (
            <span>{settings.banner.text}</span>
          )}
        </div>
      )}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-8 h-8 text-electric animate-pulse-slow" />
            <span className="text-xl md:text-2xl font-black tracking-tighter text-navy uppercase italic">Simfly<span className="text-electric">.me</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 font-semibold text-gray-600">
            <Link href={`/${lang}/check`} className="flex items-center gap-2 hover:text-electric transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse"></span>
              {dictionary.nav.checkData}
            </Link>
            <a href="#destinations" className="hover:text-electric transition-colors">{dictionary.nav.destinations}</a>
            <a href="#how-it-works" className="hover:text-electric transition-colors">{dictionary.nav.howItWorks}</a>
            <a href="#reviews" className="hover:text-electric transition-colors">{dictionary.nav.reviews}</a>
            <LanguageCurrencySelector />
            <button
              onClick={openCart}
              className="relative p-2 text-navy hover:text-electric transition-transform hover:scale-110"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-electric text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-bounce-subtle">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-4">
            <button
              onClick={openCart}
              className="relative p-2 text-navy"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-electric text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col p-4 space-y-4 font-semibold text-gray-600">
                <a href="#destinations" onClick={() => setIsMenuOpen(false)}>{dictionary.nav.destinations}</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>{dictionary.nav.howItWorks}</a>
                <a href="#reviews" onClick={() => setIsMenuOpen(false)}>{dictionary.nav.reviews}</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="bg-white pt-24 pb-12 md:pt-32 md:pb-20 px-4 md:px-8 text-center relative overflow-hidden min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center">
        {/* Globe Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 grayscale translate-y-20 scale-150 md:scale-100">
          <GlobeComponent />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black mb-6 md:mb-8 tracking-tighter leading-[0.85] text-black">
              {dictionary.hero.title} <br /> <span className="text-black/10">{dictionary.hero.subtitle}</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md mx-auto mt-12"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-black/20 group-focus-within:text-black transition-colors" />
              </div>
              <input
                type="text"
                placeholder={dictionary.hero.searchPlaceholder}
                className="w-full pl-14 pr-6 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] text-black bg-white/50 backdrop-blur-md border border-white/20 focus:bg-white focus:ring-4 focus:ring-black/[0.02] shadow-soft transition-all placeholder:text-black/40 font-black text-sm tracking-wide"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSuggestions && searchTerm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-black/5 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                  >
                    {filteredCountries.slice(0, 8).map((country) => (
                      <button
                        key={country.country}
                        onClick={() => {
                          setSearchTerm(country.country);
                          setShowSuggestions(false);
                          setSelectedCountry(country);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-black/5 transition-colors group/item"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          {country.iso && (
                            <Image
                              src={getCountryFlagUrl(country.iso, 'w80')}
                              alt={country.country}
                              fill
                              sizes="(max-width: 768px) 48px, 48px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-black text-sm text-black group-hover/item:text-black/70 transition-colors">
                            {country.country}
                          </div>
                          <div className="text-xs text-black/40 font-bold">
                            {dictionary.destinations.from} {formatPrice(country.minPrice)} • {country.packages.length} Pakete
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-black/20 group-hover/item:text-black/40 transition-colors" />
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="p-8 text-center text-black/40 font-bold text-sm">
                        Keine Länder gefunden
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Social Proof */}
            <div className="mt-8 flex items-center justify-center gap-2 opacity-60">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">{dictionary.hero.trustedBy}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Slider - Minimalist */}
      {/* Featured Deals Section */}
      <section className="px-4 pb-12 md:pb-20 relative z-20 -mt-10 md:-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x no-scrollbar">
            {(settings?.featuredDeals && settings.featuredDeals.length > 0 ? settings.featuredDeals : FEATURED_DEALS).map((deal, index) => (
              <motion.button
                key={deal.id || deal.country}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
                onClick={() => {
                  const countryData = allCountries.find(c => c.country === deal.country);
                  if (countryData) {
                    // Find the specific package matching the deal
                    const targetPkg = countryData.packages.find(p =>
                      (p.data === deal.data || parseFloat(p.data) === parseFloat(deal.data)) &&
                      Math.abs(p.price - deal.price) < 0.1
                    );
                    setSelectedPackage(targetPkg || null);
                    setSelectedCountry(countryData);
                    trackEvent('VIEW_DEAL', { country: deal.country, package: targetPkg?.name });
                  } else {
                    // Fallback if country data not loaded or not found (less likely if catalogue is loaded)
                    const fallback: CountryGroup = {
                      country: deal.country,
                      iso: deal.iso,
                      packages: [],
                      minPrice: deal.price,
                      regionGroup: deal.region || 'Other'
                    };
                    setSelectedCountry(fallback);
                    trackEvent('VIEW_DEAL', { country: deal.country, error: 'not_found' });
                  }
                }}
                className="min-w-[260px] md:min-w-[280px] snap-center bg-white rounded-[1.5rem] p-4 md:p-6 shadow-xl border border-black/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 text-left flex-shrink-0"
              >
                <div className="absolute top-0 right-0 bg-electric text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                  {dictionary.featured.deal}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden shadow-sm">
                    <Image
                      src={getCountryFlagUrl(deal.iso, 'w40')}
                      alt={deal.country}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-sm md:text-base leading-none">{deal.country}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{deal.days} {dictionary.featured.days}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-black tracking-tighter">
                    {(() => {
                      const productMatch = products.find(p => p.id === deal.productId || (p.region === deal.country && p.price === deal.price));
                      return productMatch?.data || deal.data;
                    })()}
                  </p>
                  <p className="text-sm font-bold text-electric">
                    nur {formatPrice(deal.price)}
                  </p>
                  {(() => {
                    const productMatch = products.find(p => p.id === deal.productId || (p.region === deal.country && p.price === deal.price));
                    if (productMatch?.unlimitedDetails) {
                      return (
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-tight">
                          {productMatch.unlimitedDetails.highSpeed} {dictionary.featured.highSpeed}, {dictionary.featured.throttle} {productMatch.unlimitedDetails.throttle}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase tracking-widest">{dictionary.featured.secure}</span>
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <section id="destinations" className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 pb-20 md:pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6 md:gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tighter">{dictionary.destinations.title}</h2>
            <p className="text-black/30 font-bold tracking-tight text-sm">{dictionary.destinations.subtitle}</p>
          </div>

          <div className="inline-flex gap-1 p-1 bg-black/5 rounded-2xl self-center md:self-auto border border-black/5">
            {regions.slice(0, 4).map((region) => (
              <button
                key={region}
                onClick={() => {
                  setSelectedRegion(region);
                  setVisibleCount(24);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-[14px] text-[10px] font-black tracking-widest uppercase transition-all",
                  selectedRegion === region ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black/50"
                )}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <AnimatePresence mode='popLayout'>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="group relative bg-[#F8F8F8] rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 h-64 md:h-80 overflow-hidden border border-black/[0.03]">
                  {/* Refractive shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-black/5 rounded-2xl animate-pulse" />
                      <div className="w-16 h-6 bg-black/5 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-4 pt-10">
                      <div className="w-2/3 h-8 bg-black/5 rounded-xl animate-pulse" />
                      <div className="w-1/2 h-4 bg-black/5 rounded-lg animate-pulse" />
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 h-14 bg-black/5 rounded-2xl animate-pulse" />
                </div>
              ))
            ) : (
              displayedCountries.map((country: CountryGroup, index: number) => (
                <motion.button
                  key={country.country}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                  onClick={() => {
                    setSelectedCountry(country);
                    trackEvent('ADD_TO_CART', { country: country.country });
                  }}
                  className="group bg-white/40 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 text-center shadow-soft hover:shadow-card transition-all duration-500 border border-white/50 hover:border-black/10 overflow-hidden relative"
                >
                  <div className="relative mb-4 md:mb-6 mx-auto w-16 h-16 md:w-24 md:h-24">
                    <Image
                      src={getCountryFlagUrl(country.iso, 'w160')}
                      alt={country.country}
                      fill
                      sizes="(max-width: 768px) 64px, 96px"
                      loading="lazy"
                      className="rounded-[2rem] object-cover shadow-sm grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]" />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <h3 className="font-black text-sm md:text-base text-black tracking-tight">{country.country}</h3>
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em] group-hover:text-electric transition-colors">
                      {dictionary.destinations.from} {formatPrice(country.minPrice || 0)}
                    </p>
                  </div>
                  {/* Interactive Hover Element */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                    <span className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{dictionary.destinations.choosePlan}</span>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>

        {
          !showAllCountries && filteredCountries.length > visibleCount && (
            <div className="mt-12 md:mt-20 text-center">
              <button
                onClick={() => {
                  setShowAllCountries(true);
                  setVisibleCount(v => v + 24);
                }}
                className="px-10 py-5 bg-black text-white rounded-full font-black text-xs tracking-widest uppercase hover:scale-105 transition-all active:scale-95 shadow-xl"
              >
                {dictionary.destinations.more}
              </button>
            </div>
          )
        }
        {
          showAllCountries && sortedCountries.length > visibleCount && (
            <div className="mt-12 md:mt-20 text-center">
              <button
                onClick={() => setVisibleCount(v => v + 24)}
                className="px-10 py-5 bg-black text-white rounded-full font-black text-xs tracking-widest uppercase hover:scale-105 transition-all active:scale-95 shadow-xl"
              >
                Mehr anzeigen
              </button>
            </div>
          )
        }
      </section >

      {/* How it Works - Mobile First Dark Section */}
      < section id="how-it-works" className="py-16 md:py-24 bg-black text-white rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden mx-4 mb-12 md:mb-20" >
        <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-10">
          <div className="text-center mb-12 md:mb-24">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-4 italic leading-none">{dictionary.steps.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-16">
            {[
              { icon: <Search className="w-8 h-8 stroke-1" />, title: dictionary.steps.step1, desc: dictionary.steps.desc1 },
              { icon: <Smartphone className="w-8 h-8 stroke-1" />, title: dictionary.steps.step2, desc: dictionary.steps.desc2 },
              { icon: <Check className="w-8 h-8 stroke-1" />, title: dictionary.steps.step3, desc: dictionary.steps.desc3 },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/5 transition-transform group-hover:rotate-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-black tracking-widest mb-3">{step.title}</h3>
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* eSIM Compatibility Check (Moved Down) */}
      <CompatibilityCheck />

      {/* FAQ Section (Moved Down) */}
      <section id="faq" className="py-32 bg-gray-50 border-t border-black/5">
        <div className="max-w-3xl mx-auto px-8 space-y-20">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter italic">{dictionary.faq.title}</h2>
            <p className="text-black/30 font-bold uppercase tracking-[0.3em] text-[10px]">{dictionary.faq.subtitle}</p>
          </div>

          <div className="space-y-1 border-t border-black/5">
            {(dictionary.ui.defaultFaqs && dictionary.ui.defaultFaqs.length > 0 ? dictionary.ui.defaultFaqs : INITIAL_FAQS).map((faq: { question: string, answer: string }, i: number) => (
              <details key={i} className="group border-b border-black/5 py-8">
                <summary className="flex items-center justify-between font-black text-sm uppercase tracking-widest group-hover:text-black/40 transition-colors cursor-pointer">
                  {faq.question}
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-open:rotate-45 transition-transform">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </summary>
                <div className="mt-6 text-black/40 font-bold text-sm leading-relaxed max-w-xl">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Extreme Minimalist */}
      < footer className="bg-white pt-20 pb-10 md:pt-32 md:pb-16" >
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20 mb-16 md:mb-32">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-black" />
                <span className="text-3xl font-black tracking-tighter italic">SIMFLY.ME</span>
              </div>
              <p className="text-black/30 font-bold text-sm leading-relaxed max-w-xs">
                Premium eSIM Solutions for the modern traveler. Minimalist infrastructure, maximum speed.
              </p>
            </div>

            <div className="grid grid-cols-2 col-span-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black tracking-[0.4em] uppercase text-black">Exploration</h4>
                <nav className="flex flex-col gap-4 text-xs font-black text-black/40">
                  <Link href={`/${lang}/check`} className="hover:text-electric transition-colors uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse"></span>
                    {dictionary.check.title.replace('.', '')}
                  </Link>
                  <a href="#destinations" className="hover:text-black transition-colors uppercase tracking-widest">{dictionary.nav.destinations}</a>
                  <a href={`mailto:hello@simfly.me`} className="hover:text-black transition-colors uppercase tracking-widest">hello@simfly.me</a>
                </nav>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black tracking-[0.4em] uppercase text-black">Compliance</h4>
                <nav className="flex flex-col gap-4 text-xs font-black text-black/40">
                  <Link href={`/${lang}/impressum`} className="hover:text-black transition-colors uppercase tracking-widest">{dictionary.footer.impressum}</Link>
                  <Link href={`/${lang}/agb`} className="hover:text-black transition-colors uppercase tracking-widest">{dictionary.footer.agb}</Link>
                  <Link href={`/${lang}/datenschutz`} className="hover:text-black transition-colors uppercase tracking-widest">{dictionary.footer.privacy}</Link>
                </nav>
              </div>
            </div>
          </div>

          <div className="mb-10 text-[10px] font-bold text-black/30 max-w-2xl">
            *Gemäß § 19 UStG wird keine Umsatzsteuer erhoben.
          </div>

          <div className="pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-[10px] font-black tracking-widest uppercase text-black/10 flex gap-10">
              <span>©2026 Simfly</span>
              <span>EST. Berlin</span>
            </div>
            <div className="flex gap-4 grayscale opacity-20 items-center">
              <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-[6px] font-black text-white italic">VISA</div>
              <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-[6px] font-black text-white">MC</div>
              <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-[6px] font-black text-white px-0.5 uppercase">Apple Pay</div>
              <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-[6px] font-black text-white px-0.5 uppercase">Google Pay</div>
              <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-[6px] font-black text-white px-0.5 uppercase">Klarna</div>
            </div>
          </div>
        </div>
      </footer >
      <CartSidebar />
    </div >
  );
}
