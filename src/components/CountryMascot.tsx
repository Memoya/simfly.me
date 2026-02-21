'use client';

import React from 'react';
import Image from 'next/image';
import { getCountryFlagUrl } from '@/lib/flags';

interface CountryMascotProps {
  iso: string | undefined;
  country: string;
  /** Pixel size for both width and height */
  size?: number;
  /** Sizes attribute for Next.js Image responsive sizing */
  sizes?: string;
  className?: string;
}

/**
 * Renders the Simsy mascot image for a country if available (/public/mascots/{iso}.webp),
 * otherwise falls back to the FlagCDN flag image.
 */
export default function CountryMascot({
  iso,
  country,
  size = 96,
  sizes,
  className = '',
}: CountryMascotProps) {
  // Mascots are not available, skip directly to fallback
  const useFallback = true;

  if (!iso) {
    return (
      <div className={`w-full h-full rounded-[2rem] bg-gray-100 flex items-center justify-center text-gray-400 text-2xl ${className}`}>
        -
      </div>
    );
  }

  const flagSrc = getCountryFlagUrl(iso, size >= 80 ? 'w160' : size >= 40 ? 'w80' : 'w40');

  // Use flag fallback directly since mascots are not available
  return flagSrc ? (
    <Image
      src={flagSrc}
      alt={country}
      fill
      sizes={sizes ?? `${size}px`}
      loading="lazy"
      className={`rounded-[2rem] object-cover shadow-sm grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ${className}`}
    />
  ) : (
    <div className={`w-full h-full rounded-[2rem] bg-gray-100 flex items-center justify-center text-gray-400 text-2xl ${className}`}>
      -
    </div>
  );
}
