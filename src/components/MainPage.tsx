'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Globe, Search, Smartphone, Check, Menu, X, ShoppingBag, ChevronRight } from 'lucide-react';
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
import { Marquee } from '@/components/Marquee';
import { ShinyButton } from '@/components/ShinyButton';
import { AnimatedBeam } from '@/components/AnimatedBeam';
import { SpotlightCard } from '@/components/SpotlightCard';
import CountrySearch from '@/components/CountrySearch';
import CountryMascot from '@/components/CountryMascot';

// BUG 3 fix: Use ISO codes instead of English names for popular countries filter
const popularCountriesIso = [
  'th', 'us', 'tr', 'jp',
  'de', 'es', 'fr', 'it',
  'gb', 'gr', 'ch', 'vn',
  'pt', 'id', 'kr', 'mx', 'ae'
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
  const [isMobile, setIsMobile] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const step1Ref = React.useRef<HTMLDivElement>(null);
  const step2Ref = React.useRef<HTMLDivElement>(null);
  const step3Ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Failed to load settings:', err));
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
      console.error('Failed to load products:', error);
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
      // Localize country name based on ISO if available
      let countryName = p.region;
      if (p.iso && p.iso.length === 2 && lang) {
        try {
          const regionNames = new Intl.DisplayNames([lang], { type: 'region' });
          countryName = regionNames.of(p.iso.toUpperCase()) || p.region;
        } catch (e) {
          // Fallback to original
        }
      }

      if (!map[countryName]) {
        map[countryName] = {
          country: countryName,
          iso: p.iso || '',
          packages: [],
          minPrice: p.price,
          regionGroup: p.regionGroup,
        };
      }
      map[countryName].packages.push(p);
      if (p.price < map[countryName].minPrice) {
        map[countryName].minPrice = p.price;
      }
    });
    return map;
  }, [products, lang]);

  const allCountries = useMemo(() => Object.values(countriesMap), [countriesMap]);

  const popularCountriesList = useMemo(() => {
    return popularCountriesIso
      .map(iso => allCountries.find(c => c.iso?.toLowerCase() === iso.toLowerCase())?.country)
      .filter((name): name is string => name !== undefined);
  }, [allCountries]);

  const regions = useMemo(() => {
    const rawRegions = Array.from(new Set(allCountries.map((c) => c.regionGroup || 'Other')));
    const priority = ['Europe', 'Asia', 'Africa', 'Middle East', 'Oceania'];
    // Filter to show only the most important/common regions to keep the UI clean
    return ['All', ...priority.filter(p => rawRegions.includes(p))];
  }, [allCountries]);

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
      a.country.localeCompare(b.country, lang)
    );

    if (!showAllCountries && searchTerm === '' && selectedRegion === 'All') {
      return sorted.filter((c: CountryGroup) => popularCountriesIso.includes(c.iso?.toLowerCase()));
    }

    return sorted;
  }, [filteredCountries, showAllCountries, searchTerm, selectedRegion, lang]);

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
            <a href="#destinations" className="hover:text-electric transition-colors">{dictionary.nav.destinations}</a>
            <a href="#how-it-works" className="hover:text-electric transition-colors">{dictionary.nav.howItWorks}</a>
            <Link href={`/${lang}/check`} className="hover:text-electric transition-colors">{dictionary.nav.checkData}</Link>
            <LanguageCurrencySelector />
            <button
              onClick={openCart}
              aria-label={`Einkaufswagen öffnen, ${cartCount} Artikel`}
              className="relative p-2 text-navy hover:text-electric transition-transform hover:scale-110"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-electric text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-bounce-subtle" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            <LanguageCurrencySelector />
            <button
              onClick={openCart}
              aria-label={`Einkaufswagen öffnen, ${cartCount} Artikel`}
              className="relative p-2 text-navy"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-electric text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Menü schließen" : "Menü öffnen"}
              className="p-2"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, maxHeight: "0px" }}
              animate={{ opacity: 1, maxHeight: "320px" }}
              exit={{ opacity: 0, maxHeight: "0px" }}
              style={{ overflow: "hidden", maxHeight: 0 }}
              className="md:hidden bg-white border-b border-gray-100"
            >
              <div className="flex flex-col p-4 space-y-4 font-semibold text-gray-600">
                <a href="#destinations" onClick={() => setIsMenuOpen(false)}>{dictionary.nav.destinations}</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>{dictionary.nav.howItWorks}</a>
                <Link href={`/${lang}/check`} onClick={() => setIsMenuOpen(false)} className="text-electric">
                  {dictionary.nav.checkData}
                </Link>
                <div className="pt-2 border-t border-gray-100">
                  <LanguageCurrencySelector />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section role="main" className="bg-white pt-24 pb-12 md:pt-32 md:pb-20 px-4 md:px-8 text-center relative overflow-hidden min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center">
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
            <CountrySearch
              countries={allCountries}
              placeholder={dictionary.hero.searchPlaceholder}
              onCountrySelect={(country) => setSelectedCountry(country)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              formatPrice={formatPrice}
              lang={lang}
              translations={{
                from: dictionary.destinations.from || 'From',
                packages: dictionary.destinations.packages || 'packages',
                noResults: 'Keine Länder gefunden'
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <ShinyButton
              onClick={() => {
                const destinations = document.getElementById('destinations');
                if (destinations) destinations.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 text-lg font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform"
            >
              {dictionary.destinations.choosePlan}
            </ShinyButton>
          </motion.div>
        </div>

        {/* Marquee Section */}
        <div className="mt-20 md:mt-32 w-full max-w-7xl mx-auto relative overflow-hidden">
          <Marquee className="[--duration:30s] [--gap:2rem]" pauseOnHover>
            {popularCountriesList.map((countryName) => {
              const country = allCountries.find(c => c.country === countryName);
              if (!country) return null;
              return (
                <div
                  key={countryName}
                  onClick={() => setSelectedCountry(country)}
                  className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-black/5 cursor-pointer hover:bg-white transition-colors group"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                    {(() => {
                      const flagUrl = getCountryFlagUrl(country.iso, 'w40');
                      return flagUrl ? (
                        <Image
                          src={flagUrl}
                          alt={countryName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">-</span>
                      );
                    })()}
                  </div>
                  <span className="font-black text-base uppercase tracking-wider">{countryName}</span>
                </div>
              );
            })}
          </Marquee>
          <Marquee reverse className="[--duration:25s] [--gap:2rem] mt-4" pauseOnHover>
            {/* Rotate the list to avoid direct overlaps with the first row */}
            {[...popularCountriesList.slice(Math.floor(popularCountriesList.length / 2)), ...popularCountriesList.slice(0, Math.floor(popularCountriesList.length / 2))].reverse().map((countryName) => {
              const country = allCountries.find(c => c.country === countryName);
              if (!country) return null;
              return (
                <div
                  key={countryName}
                  onClick={() => setSelectedCountry(country)}
                  className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-black/5 cursor-pointer hover:bg-white transition-colors group"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                    {(() => {
                      const flagUrl = getCountryFlagUrl(country.iso, 'w40');
                      return flagUrl ? (
                        <Image
                          src={flagUrl}
                          alt={countryName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">-</span>
                      );
                    })()}
                  </div>
                  <span className="font-black text-base uppercase tracking-wider">{countryName}</span>
                </div>
              );
            })}
          </Marquee>

          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
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
                  // Search by ISO code instead of localized country name
                  const countryData = allCountries.find(c => 
                    c.iso?.toLowerCase() === deal.iso?.toLowerCase()
                  );
                  
                  if (countryData && countryData.packages.length > 0) {
                    // Normalize data strings for comparison (remove spaces)
                    const normalizeData = (str: string) => str.replace(/\s+/g, '').toUpperCase();
                    
                    // Find the specific package matching the deal
                    const targetPkg = countryData.packages.find(p => {
                      const dataMatch = normalizeData(p.data) === normalizeData(deal.data);
                      const priceMatch = Math.abs(p.price - deal.price) < 0.1;
                      const durationMatch = p.durationRaw === deal.days;
                      
                      return dataMatch && priceMatch && durationMatch;
                    });
                    
                    setSelectedPackage(targetPkg || null);
                    setSelectedCountry(countryData);
                    trackEvent('VIEW_DEAL', { 
                      country: deal.country, 
                      iso: deal.iso,
                      package: targetPkg?.name,
                      found: !!targetPkg 
                    });
                  } else {
                    // Country not found in catalogue - should not happen if data is correct
                    console.warn('Deal country not found:', deal.country, deal.iso);
                    trackEvent('VIEW_DEAL', { 
                      country: deal.country, 
                      iso: deal.iso,
                      error: 'country_not_found' 
                    });
                  }
                }}
                className="min-w-[180px] md:min-w-[280px] snap-center relative group hover:-translate-y-1 transition-transform duration-300 text-left flex-shrink-0 p-0 bg-transparent border-none outline-none focus:outline-none"
              >
                <SpotlightCard className="h-full w-full p-3 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border-black/5 shadow-lg md:shadow-xl bg-white relative overflow-hidden">



                  {/* Shimmering DEAL Badge */}
                  <div className="absolute top-0 right-0 bg-electric text-white text-[9px] md:text-[10px] font-black px-2.5 md:px-3 py-1 rounded-bl-lg md:rounded-bl-xl uppercase tracking-widest overflow-hidden">
                    <span className="relative z-10">{dictionary.featured.deal}</span>
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    />
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 relative z-10">
                    <div className="relative w-7 h-7 md:w-10 md:h-10 rounded-full overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const flagUrl = getCountryFlagUrl(deal.iso, 'w40');
                        return flagUrl ? (
                          <Image
                            src={flagUrl}
                            alt={deal.country}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">-</span>
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="font-black text-base md:text-lg leading-none mb-1 md:mb-0">{deal.country}</h3>
                      <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">{deal.days} {dictionary.featured.days}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-2 relative z-10 py-6">
                    <p className="text-5xl md:text-3xl font-black tracking-tighter text-center">
                      {(() => {
                        const productMatch = products.find(p => p.id === deal.productId || (p.region === deal.country && p.price === deal.price));
                        return productMatch?.data || deal.data;
                      })()}
                    </p>
                    <motion.p
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="text-xl md:text-sm font-black text-electric text-center"
                    >
                      nur {formatPrice(deal.price)}
                    </motion.p>
                    {(() => {
                      const productMatch = products.find(p => p.id === deal.productId || (p.region === deal.country && p.price === deal.price));
                      if (productMatch?.unlimitedDetails) {
                        return (
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center mt-2">
                            {productMatch.unlimitedDetails.highSpeed} {dictionary.featured.highSpeed} • {productMatch.unlimitedDetails.throttle}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </SpotlightCard>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <section id="destinations" className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 pb-20 md:pb-32" >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6 md:gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tighter">{dictionary.destinations.title}</h2>
            <p className="text-black/30 font-bold tracking-tight text-sm">{dictionary.destinations.subtitle}</p>
          </div>

          <div className="inline-flex gap-1 p-1 bg-black/5 rounded-2xl self-center md:self-auto border border-black/5 overflow-x-auto no-scrollbar max-w-full">
            {regions.slice(0, 5).map((region) => (
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
                  <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto">
                    <CountryMascot
                      iso={country.iso}
                      country={country.country}
                      size={96}
                      sizes="(max-width: 768px) 64px, 96px"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]" />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <h3 className="font-black text-base md:text-lg text-black tracking-tight">{country.country}</h3>
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
      </section>

      <section id="how-it-works" className="py-16 md:py-24 bg-black text-white rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden mx-4 mb-12 md:mb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-10" ref={containerRef}>
          <div className="text-center mb-12 md:mb-24">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-4 italic leading-none">{dictionary.steps.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-16 relative">
            {!isMobile && (
              <>
                <AnimatedBeam
                  containerRef={containerRef}
                  fromRef={step1Ref}
                  toRef={step2Ref}
                  duration={3}
                  curvature={-50}
                  pathColor="#ffffff"
                  gradientStartColor="#000000"
                  gradientStopColor="#ffffff"
                  pathOpacity={0.1}
                />
                <AnimatedBeam
                  containerRef={containerRef}
                  fromRef={step2Ref}
                  toRef={step3Ref}
                  duration={3}
                  curvature={50}
                  delay={1.5}
                  pathColor="#ffffff"
                  gradientStartColor="#000000"
                  gradientStopColor="#ffffff"
                  pathOpacity={0.1}
                />
              </>
            )}

            <motion.div
              variants={{
                show: { transition: { staggerChildren: 0.2 } }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-3 gap-8 md:gap-16 relative w-full justify-items-center md:col-span-3"
            >
              {[
                { icon: <Search className="w-8 h-8 stroke-1" />, title: dictionary.steps.step1, desc: dictionary.steps.desc1, ref: step1Ref },
                { icon: <Smartphone className="w-8 h-8 stroke-1" />, title: dictionary.steps.step2, desc: dictionary.steps.desc2, ref: step2Ref },
                { icon: <Check className="w-8 h-8 stroke-1" />, title: dictionary.steps.step3, desc: dictionary.steps.desc3, ref: step3Ref },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="flex flex-col items-center text-center group z-20 w-full max-w-xs mx-auto"
                >
                  <div
                    ref={step.ref}
                    className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/5 transition-transform group-hover:rotate-6 relative z-10"
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-black tracking-widest mb-3">{step.title}</h3>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

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
      <footer className="bg-white pt-20 pb-10 md:pt-32 md:pb-16">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20 mb-16 md:mb-32">
            <div className="space-y-8">
              <Link href={`/${lang}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                <Globe className="w-8 h-8 text-black" />
                <span className="text-3xl font-black tracking-tighter italic">SIMFLY.ME</span>
              </Link>
              <p className="text-black/30 font-bold text-sm leading-relaxed max-w-xs">
                Premium eSIM Solutions for the modern traveler. Minimalist infrastructure, maximum speed.
              </p>
            </div>

            <div className="grid grid-cols-2 col-span-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black tracking-[0.4em] uppercase text-black">Exploration</h4>
                <nav className="flex flex-col gap-4 text-xs font-black text-black/40">
                  <a href="#destinations" className="hover:text-black transition-colors uppercase tracking-widest">{dictionary.nav.destinations}</a>
                  <a href={`mailto:hello@simfly.me`} className="hover:text-black transition-colors uppercase tracking-widest">hello@simfly.me</a>
                  <Link href={`/${lang}/check`} className="hover:text-electric transition-colors uppercase tracking-widest">
                    {dictionary.nav.checkData}
                  </Link>
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
            <div className="text-[10px] font-black tracking-widest uppercase text-black/10">
              <span>©2026 Simfly</span>
            </div>
            <div className="flex gap-10">
              {/* Payment logos removed for cleaner aesthetic */}
            </div>
          </div>
        </div>
      </footer>
      <CartSidebar />
    </div>
  );
}
