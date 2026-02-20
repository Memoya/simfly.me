'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getCountryFlagUrl } from '@/lib/flags';
import { CountryGroup } from '@/types';

interface CountrySearchProps {
  countries: CountryGroup[];
  placeholder: string;
  onCountrySelect: (country: CountryGroup) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  formatPrice: (price: number) => string;
  lang: string;
  translations: {
    from: string;
    packages: string;
    noResults: string;
  };
}

// Function to normalize strings for better search matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

// Get localized country names in multiple languages for better search
function getCountrySearchTerms(country: CountryGroup, lang: string): string[] {
  const terms = [country.country, country.iso || ''];

  // Add localized name variants
  if (country.iso && country.iso.length === 2) {
    try {
      // Try to get names in different languages for multilingual support
      const languages = ['en', 'de', 'fr', 'es', 'it', 'pt', lang];
      const regionNames = new Intl.DisplayNames(languages, { type: 'region' });
      const localizedName = regionNames.of(country.iso.toUpperCase());
      if (localizedName && localizedName !== country.country) {
        terms.push(localizedName);
      }
    } catch (e) {
      // Fallback silently
    }
  }

  return terms.map(normalizeString).filter(Boolean);
}

// Filter countries based on search term
function filterCountries(countries: CountryGroup[], searchTerm: string, lang: string): CountryGroup[] {
  if (!searchTerm.trim()) {
    return countries;
  }

  const normalizedSearch = normalizeString(searchTerm);

  return countries.filter((country) => {
    const searchTerms = getCountrySearchTerms(country, lang);
    return searchTerms.some(term => term.includes(normalizedSearch));
  });
}

export default function CountrySearch({
  countries,
  placeholder,
  onCountrySelect,
  searchTerm,
  onSearchChange,
  formatPrice,
  lang,
  translations
}: CountrySearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    const filtered = filterCountries(countries, searchTerm, lang);
    // Sort by name
    return filtered.sort((a, b) => a.country.localeCompare(b.country, lang));
  }, [countries, searchTerm, lang]);

  // Show all countries when focused (empty search) or when searching
  const displayedCountries = showSuggestions ? filteredCountries : [];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < displayedCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectCountry(displayedCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const handleSelectCountry = (country: CountryGroup) => {
    onSearchChange(country.country);
    setShowSuggestions(false);
    onCountrySelect(country);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered countries change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredCountries]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-black/20 group-focus-within:text-black transition-colors" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-14 pr-6 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] text-black bg-white/50 backdrop-blur-md border border-white/20 focus:bg-white focus:ring-4 focus:ring-black/[0.02] shadow-soft transition-all placeholder:text-black/40 font-black text-sm tracking-wide"
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-black/5 overflow-hidden z-50 max-h-[calc(100vh-200px)] overflow-y-auto"
          >
            {displayedCountries.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {displayedCountries.map((country, index) => (
                  <motion.button
                    key={country.country}
                    onClick={() => handleSelectCountry(country)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center gap-4 px-4 py-3 transition-colors ${
                      index === highlightedIndex
                        ? 'bg-electric/10'
                        : 'hover:bg-black/[0.03]'
                    }`}
                  >
                    {/* Flag */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {(() => {
                        const flagUrl = getCountryFlagUrl(country.iso, 'w40');
                        return flagUrl ? (
                          <Image
                            src={flagUrl}
                            alt={country.country}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">-</span>
                        );
                      })()}
                    </div>

                    {/* Country Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-black text-sm text-black truncate">
                        {country.country}
                      </div>
                      <div className="text-xs text-black/40 font-bold truncate">
                        {translations.from} {formatPrice(country.minPrice)} • {country.packages.length > 0 ? country.packages.length : 1} {translations.packages}
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <ChevronRight className="w-4 h-4 text-black/20 flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-black/40 font-bold text-sm">
                {translations.noResults}
              </div>
            )}

            {/* Info text when showing all countries */}
            {displayedCountries.length > 0 && searchTerm === '' && (
              <div className="px-4 py-3 bg-black/[0.03] text-center text-black/30 font-semibold text-xs uppercase tracking-widest border-t border-gray-100">
                {lang === 'de' && `${displayedCountries.length} Länder verfügbar`}
                {lang === 'en' && `${displayedCountries.length} countries available`}
                {lang !== 'de' && lang !== 'en' && `${displayedCountries.length} ${translations.packages}`}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
