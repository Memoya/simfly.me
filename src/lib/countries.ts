// Country name translations (German <-> English)
export const countryTranslations: Record<string, string[]> = {
    // Popular destinations
    'Thailand': ['thailand', 'th'],
    'Germany': ['germany', 'deutschland', 'de'],
    'Turkey': ['turkey', 'türkei', 'turkei', 'türkiye', 'tr'],
    'USA': ['usa', 'united states', 'amerika', 'vereinigte staaten', 'us'],
    'Japan': ['japan', 'jp'],
    'Spain': ['spain', 'spanien', 'es'],
    'France': ['france', 'frankreich', 'fr'],
    'Italy': ['italy', 'italien', 'it'],
    'United Kingdom': ['uk', 'united kingdom', 'großbritannien', 'england', 'gb'],
    'Greece': ['greece', 'griechenland', 'gr'],
    'Portugal': ['portugal', 'pt'],
    'Netherlands': ['netherlands', 'niederlande', 'holland', 'nl'],
    'Austria': ['austria', 'österreich', 'osterreich', 'at'],
    'Switzerland': ['switzerland', 'schweiz', 'ch'],
    'Poland': ['poland', 'polen', 'pl'],
    'Czech Republic': ['czech republic', 'tschechien', 'cz'],
    'Croatia': ['croatia', 'kroatien', 'hr'],
    'Sweden': ['sweden', 'schweden', 'se'],
    'Norway': ['norway', 'norwegen', 'no'],
    'Denmark': ['denmark', 'dänemark', 'danemark', 'dk'],
    'Finland': ['finland', 'finnland', 'fi'],
    'Belgium': ['belgium', 'belgien', 'be'],
    'Ireland': ['ireland', 'irland', 'ie'],
    'Iceland': ['iceland', 'island', 'is'],
    'Hungary': ['hungary', 'ungarn', 'hu'],
    'Romania': ['romania', 'rumänien', 'rumanien', 'ro'],
    'Bulgaria': ['bulgaria', 'bulgarien', 'bg'],
    'Serbia': ['serbia', 'serbien', 'rs'],
    'Albania': ['albania', 'albanien', 'al'],
    'Slovakia': ['slovakia', 'slowakei', 'sk'],
    'Slovenia': ['slovenia', 'slowenien', 'si'],
    'Estonia': ['estonia', 'estland', 'ee'],
    'Latvia': ['latvia', 'lettland', 'lv'],
    'Lithuania': ['lithuania', 'litauen', 'lt'],
    'Luxembourg': ['luxembourg', 'luxemburg', 'lu'],
    'Malta': ['malta', 'mt'],
    'Cyprus': ['cyprus', 'zypern', 'cy'],
    'Australia': ['australia', 'australien', 'au'],
    'New Zealand': ['new zealand', 'neuseeland', 'nz'],
    'Canada': ['canada', 'kanada', 'ca'],
    'Mexico': ['mexico', 'mexiko', 'mx'],
    'Brazil': ['brazil', 'brasilien', 'br'],
    'Argentina': ['argentina', 'argentinien', 'ar'],
    'South Africa': ['south africa', 'südafrika', 'sudafrika', 'za'],
    'Egypt': ['egypt', 'ägypten', 'agypten', 'eg'],
    'Morocco': ['morocco', 'marokko', 'ma'],
    'United Arab Emirates': ['uae', 'dubai', 'vereinigte arabische emirate', 'ae'],
    'China': ['china', 'cn'],
    'South Korea': ['south korea', 'südkorea', 'sudkorea', 'korea', 'kr'],
    'Singapore': ['singapore', 'singapur', 'sg'],
    'Malaysia': ['malaysia', 'my'],
    'Indonesia': ['indonesia', 'indonesien', 'id'],
    'Philippines': ['philippines', 'philippinen', 'ph'],
    'Vietnam': ['vietnam', 'vn'],
    'India': ['india', 'indien', 'in'],
};

/**
 * Check if a country matches a search term (supports German & English)
 */
export function matchesSearchTerm(countryName: string, searchTerm: string): boolean {
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (!lowerSearch) return true;

    // Direct name match
    if (countryName.toLowerCase().includes(lowerSearch)) return true;

    // Check translations
    const translations = countryTranslations[countryName] || [];
    return translations.some(trans => trans.includes(lowerSearch));
}
