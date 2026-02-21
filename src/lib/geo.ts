/**
 * Geo-Detection & DSGVO Compliance
 * Cookie Banner only for EU visitors
 */

// EU member states + EEA countries subject to DSGVO
export const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czechia
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  // EEA countries
  'IS', // Iceland
  'LI', // Liechtenstein
  'NO', // Norway
  // Swiss-like (similar data protection laws)
  'CH', // Switzerland
];

export function isEUCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return true; // Show banner for unknown countries (safe default)
  return EU_COUNTRIES.includes(countryCode.toUpperCase());
}
