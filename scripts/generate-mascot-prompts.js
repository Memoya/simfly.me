#!/usr/bin/env node
/**
 * Simsy Mascot Prompt Generator
 *
 * Generates AI image prompts for all countries.
 * Run with:  node scripts/generate-mascot-prompts.js
 *
 * Then paste each prompt into Midjourney, DALL-E 3, Adobe Firefly, etc.
 * Save the output as:  public/mascots/{iso}.webp  (transparent background recommended)
 *
 * Recommended export settings:
 *   - Size: 512x512 or 1024x1024
 *   - Format: WebP (lossy 90%) or PNG
 *   - Note: API script (generate-mascots-api.js) saves as .png automatically
 *   - Background: transparent or soft gradient
 */

const landmarks = {
  // Europe
  de: { country: 'Germany', landmark: 'Brandenburg Gate silhouette' },
  fr: { country: 'France', landmark: 'Eiffel Tower silhouette' },
  es: { country: 'Spain', landmark: 'Sagrada Familia silhouette' },
  it: { country: 'Italy', landmark: 'Colosseum silhouette' },
  gb: { country: 'United Kingdom', landmark: 'Big Ben silhouette' },
  gr: { country: 'Greece', landmark: 'Parthenon silhouette' },
  ch: { country: 'Switzerland', landmark: 'Matterhorn mountain silhouette' },
  nl: { country: 'Netherlands', landmark: 'windmill silhouette' },
  at: { country: 'Austria', landmark: 'Schönbrunn Palace silhouette' },
  pl: { country: 'Poland', landmark: 'Wawel Castle silhouette' },
  cz: { country: 'Czech Republic', landmark: 'Prague Castle silhouette' },
  se: { country: 'Sweden', landmark: 'Vasa ship silhouette' },
  no: { country: 'Norway', landmark: 'fjord silhouette' },
  dk: { country: 'Denmark', landmark: 'Little Mermaid statue silhouette' },
  fi: { country: 'Finland', landmark: 'Northern Lights aurora silhouette' },
  be: { country: 'Belgium', landmark: 'Atomium silhouette' },
  ie: { country: 'Ireland', landmark: 'Cliffs of Moher silhouette' },
  hu: { country: 'Hungary', landmark: 'Hungarian Parliament silhouette' },
  ro: { country: 'Romania', landmark: 'Bran Castle silhouette' },
  bg: { country: 'Bulgaria', landmark: 'Alexander Nevsky Cathedral silhouette' },
  rs: { country: 'Serbia', landmark: 'Kalemegdan Fortress silhouette' },
  hr: { country: 'Croatia', landmark: 'Dubrovnik city walls silhouette' },
  sk: { country: 'Slovakia', landmark: 'Bratislava Castle silhouette' },
  si: { country: 'Slovenia', landmark: 'Bled island church silhouette' },
  ee: { country: 'Estonia', landmark: 'Tallinn Old Town tower silhouette' },
  lv: { country: 'Latvia', landmark: 'Riga Cathedral silhouette' },
  lt: { country: 'Lithuania', landmark: 'Vilnius Cathedral silhouette' },
  lu: { country: 'Luxembourg', landmark: 'Vianden Castle silhouette' },
  mt: { country: 'Malta', landmark: 'Valletta city gate silhouette' },
  cy: { country: 'Cyprus', landmark: 'Aphrodite Rock silhouette' },
  pt: { country: 'Portugal', landmark: 'Belém Tower silhouette' },
  al: { country: 'Albania', landmark: 'Berat Castle silhouette' },
  mk: { country: 'North Macedonia', landmark: 'Stone Bridge Skopje silhouette' },
  ba: { country: 'Bosnia and Herzegovina', landmark: 'Stari Most bridge silhouette' },
  me: { country: 'Montenegro', landmark: 'Bay of Kotor silhouette' },
  md: { country: 'Moldova', landmark: 'Soroca Fortress silhouette' },
  ua: { country: 'Ukraine', landmark: 'Kyiv Pechersk Lavra silhouette' },
  by: { country: 'Belarus', landmark: 'Mir Castle silhouette' },
  is: { country: 'Iceland', landmark: 'Hallgrímskirkja church silhouette' },
  tr: { country: 'Turkey', landmark: 'Blue Mosque silhouette' },
  ru: { country: 'Russia', landmark: 'Saint Basil Cathedral silhouette' },
  ge: { country: 'Georgia', landmark: 'Vardzia cave monastery silhouette' },
  am: { country: 'Armenia', landmark: 'Mount Ararat silhouette' },
  az: { country: 'Azerbaijan', landmark: 'Flame Towers silhouette' },
  // Asia
  th: { country: 'Thailand', landmark: 'Wat Arun temple silhouette' },
  jp: { country: 'Japan', landmark: 'Mount Fuji with torii gate silhouette' },
  kr: { country: 'South Korea', landmark: 'Gyeongbokgung Palace silhouette' },
  cn: { country: 'China', landmark: 'Great Wall silhouette' },
  vn: { country: 'Vietnam', landmark: 'Halong Bay limestone karst silhouette' },
  sg: { country: 'Singapore', landmark: 'Marina Bay Sands silhouette' },
  my: { country: 'Malaysia', landmark: 'Petronas Twin Towers silhouette' },
  id: { country: 'Indonesia', landmark: 'Borobudur temple silhouette' },
  ph: { country: 'Philippines', landmark: 'Chocolate Hills silhouette' },
  in: { country: 'India', landmark: 'Taj Mahal silhouette' },
  pk: { country: 'Pakistan', landmark: 'K2 mountain silhouette' },
  bd: { country: 'Bangladesh', landmark: 'Ahsan Manzil palace silhouette' },
  lk: { country: 'Sri Lanka', landmark: 'Sigiriya Rock Fortress silhouette' },
  kh: { country: 'Cambodia', landmark: 'Angkor Wat silhouette' },
  hk: { country: 'Hong Kong', landmark: 'Victoria Peak skyline silhouette' },
  tw: { country: 'Taiwan', landmark: 'Taipei 101 silhouette' },
  mm: { country: 'Myanmar', landmark: 'Shwedagon Pagoda silhouette' },
  la: { country: 'Laos', landmark: 'Pha That Luang temple silhouette' },
  np: { country: 'Nepal', landmark: 'Mount Everest silhouette' },
  bt: { country: 'Bhutan', landmark: 'Tiger Nest monastery silhouette' },
  mn: { country: 'Mongolia', landmark: 'Genghis Khan statue silhouette' },
  kz: { country: 'Kazakhstan', landmark: 'Bayterek Tower silhouette' },
  uz: { country: 'Uzbekistan', landmark: 'Registan square silhouette' },
  kg: { country: 'Kyrgyzstan', landmark: 'Ala-Too Square silhouette' },
  // Middle East
  ae: { country: 'United Arab Emirates', landmark: 'Burj Khalifa silhouette' },
  sa: { country: 'Saudi Arabia', landmark: 'Kaaba Mecca silhouette' },
  il: { country: 'Israel', landmark: 'Dome of the Rock silhouette' },
  jo: { country: 'Jordan', landmark: 'Petra Treasury silhouette' },
  lb: { country: 'Lebanon', landmark: 'Pigeon Rocks Beirut silhouette' },
  om: { country: 'Oman', landmark: 'Sultan Qaboos Grand Mosque silhouette' },
  kw: { country: 'Kuwait', landmark: 'Kuwait Towers silhouette' },
  bh: { country: 'Bahrain', landmark: 'Bahrain Fort silhouette' },
  qa: { country: 'Qatar', landmark: 'Museum of Islamic Art silhouette' },
  iq: { country: 'Iraq', landmark: 'Arch of Ctesiphon silhouette' },
  ir: { country: 'Iran', landmark: 'Nasir al-Mulk mosque silhouette' },
  // Americas
  us: { country: 'United States', landmark: 'Statue of Liberty silhouette' },
  ca: { country: 'Canada', landmark: 'CN Tower silhouette' },
  mx: { country: 'Mexico', landmark: 'Chichen Itza pyramid silhouette' },
  br: { country: 'Brazil', landmark: 'Christ the Redeemer silhouette' },
  ar: { country: 'Argentina', landmark: 'Iguazu Falls silhouette' },
  cl: { country: 'Chile', landmark: 'Torres del Paine mountain silhouette' },
  co: { country: 'Colombia', landmark: 'Cartagena walled city silhouette' },
  pe: { country: 'Peru', landmark: 'Machu Picchu silhouette' },
  ec: { country: 'Ecuador', landmark: 'Cotopaxi volcano silhouette' },
  bo: { country: 'Bolivia', landmark: 'Salar de Uyuni salt flat silhouette' },
  py: { country: 'Paraguay', landmark: 'Jesuit ruins silhouette' },
  uy: { country: 'Uruguay', landmark: 'Ciudad Vieja lighthouse silhouette' },
  ve: { country: 'Venezuela', landmark: 'Angel Falls silhouette' },
  gy: { country: 'Guyana', landmark: 'Kaieteur Falls silhouette' },
  cr: { country: 'Costa Rica', landmark: 'Arenal volcano silhouette' },
  pa: { country: 'Panama', landmark: 'Panama Canal lock silhouette' },
  cu: { country: 'Cuba', landmark: 'Havana Capitol building silhouette' },
  do: { country: 'Dominican Republic', landmark: 'Columbus Lighthouse silhouette' },
  jm: { country: 'Jamaica', landmark: 'Blue Mountains silhouette' },
  pr: { country: 'Puerto Rico', landmark: 'El Morro Fort silhouette' },
  gt: { country: 'Guatemala', landmark: 'Tikal temple silhouette' },
  hn: { country: 'Honduras', landmark: 'Copan ruins silhouette' },
  sv: { country: 'El Salvador', landmark: 'Santa Ana volcano silhouette' },
  ni: { country: 'Nicaragua', landmark: 'Masaya volcano silhouette' },
  // Africa
  za: { country: 'South Africa', landmark: 'Table Mountain silhouette' },
  eg: { country: 'Egypt', landmark: 'Giza Pyramid silhouette' },
  ma: { country: 'Morocco', landmark: 'Koutoubia Mosque minaret silhouette' },
  ke: { country: 'Kenya', landmark: 'Mount Kilimanjaro silhouette' },
  ng: { country: 'Nigeria', landmark: 'Zuma Rock silhouette' },
  et: { country: 'Ethiopia', landmark: 'Lalibela rock church silhouette' },
  tz: { country: 'Tanzania', landmark: 'Mount Kilimanjaro silhouette' },
  gh: { country: 'Ghana', landmark: 'Cape Coast Castle silhouette' },
  sn: { country: 'Senegal', landmark: 'African Renaissance Monument silhouette' },
  ci: { country: "Côte d'Ivoire", landmark: 'Basilica of Our Lady of Peace silhouette' },
  cm: { country: 'Cameroon', landmark: 'Mount Cameroon silhouette' },
  rw: { country: 'Rwanda', landmark: 'Virunga volcano silhouette' },
  ug: { country: 'Uganda', landmark: 'Bwindi jungle silhouette' },
  mz: { country: 'Mozambique', landmark: 'Island of Mozambique fortress silhouette' },
  mg: { country: 'Madagascar', landmark: 'Avenue of the Baobabs silhouette' },
  mu: { country: 'Mauritius', landmark: 'Le Morne Brabant mountain silhouette' },
  tn: { country: 'Tunisia', landmark: 'Amphitheatre of El Djem silhouette' },
  dz: { country: 'Algeria', landmark: 'Timgad Roman ruins silhouette' },
  ly: { country: 'Libya', landmark: 'Leptis Magna ruins silhouette' },
  sd: { country: 'Sudan', landmark: 'Meroe Pyramids silhouette' },
  // Oceania
  au: { country: 'Australia', landmark: 'Sydney Opera House silhouette' },
  nz: { country: 'New Zealand', landmark: 'Sky Tower Auckland silhouette' },
  fj: { country: 'Fiji', landmark: 'tropical palm island silhouette' },
  pg: { country: 'Papua New Guinea', landmark: 'Kokoda Trail mountain silhouette' },
  ws: { country: 'Samoa', landmark: 'scenic waterfall silhouette' },
  to: { country: 'Tonga', landmark: "Ha'amonga Trilithon silhouette" },
};

const FORMAT = process.argv[2] || 'text'; // 'text' | 'csv' | 'json'

function buildPrompt(iso, { country, landmark }) {
  return (
    `3D mascot shaped like a SIM card, modern playful style, ` +
    `country: ${country}, wearing subtle flag-inspired colors, ` +
    `holding or standing near a minimal travel icon of ${landmark}, ` +
    `clean soft gradient background, high detail 3D render, ` +
    `brand-consistent, glossy material, front-facing, centered composition`
  );
}

if (FORMAT === 'json') {
  const output = Object.entries(landmarks).map(([iso, data]) => ({
    iso,
    filename: `public/mascots/${iso}.webp`,
    country: data.country,
    landmark: data.landmark,
    prompt: buildPrompt(iso, data),
  }));
  console.log(JSON.stringify(output, null, 2));
} else if (FORMAT === 'csv') {
  console.log('iso,country,landmark,filename,prompt');
  for (const [iso, data] of Object.entries(landmarks)) {
    const prompt = buildPrompt(iso, data).replace(/"/g, '""');
    console.log(`${iso},"${data.country}","${data.landmark}","public/mascots/${iso}.webp","${prompt}"`);
  }
} else {
  // Default: human-readable text
  console.log('='.repeat(80));
  console.log('SIMSY MASCOT PROMPTS');
  console.log(`Total: ${Object.keys(landmarks).length} countries`);
  console.log('Save each image as: public/mascots/{iso}.webp (512x512 or 1024x1024)');
  console.log('='.repeat(80));
  console.log();
  for (const [iso, data] of Object.entries(landmarks)) {
    console.log(`[${iso.toUpperCase()}] ${data.country}`);
    console.log(`File: public/mascots/${iso}.webp`);
    console.log(`Prompt: ${buildPrompt(iso, data)}`);
    console.log();
  }
}
