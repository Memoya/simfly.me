#!/usr/bin/env node
/**
 * Simsy Mascot Image Generator — OpenAI DALL-E 3
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-mascots-api.js
 *
 * Or add to .env.local:
 *   OPENAI_API_KEY=sk-...
 * Then run:
 *   node scripts/generate-mascots-api.js
 *
 * Options:
 *   --only=de,us,jp       Only generate specific ISO codes
 *   --from=de             Start from this ISO code (resume)
 *   --quality=standard    standard (default) or hd
 *
 * Images saved to: public/mascots/{iso}.png
 * Already-existing files are skipped automatically.
 *
 * Rate limit: DALL-E 3 allows ~5 images/min on Tier 1.
 * The script waits 13 seconds between requests to stay safe.
 */

const fs = require('fs');
const path = require('path');

// Load .env.local manually (dotenv reads .env by default, not .env.local)
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set.');
  console.error('Add it to .env.local or run: OPENAI_API_KEY=sk-... node scripts/generate-mascots-api.js');
  process.exit(1);
}

// Parse CLI args
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? true];
    })
);

const QUALITY = args.quality === 'hd' ? 'hd' : 'standard';
const ONLY_ISOS = args.only ? args.only.split(',').map(s => s.trim().toLowerCase()) : null;
const FROM_ISO  = args.from ? args.from.toLowerCase() : null;
const DELAY_MS  = 13_000; // 13s between requests → ~4.6/min, safe for Tier 1
const OUT_DIR   = path.join(__dirname, '..', 'public', 'mascots');

// Landmark data (keep in sync with src/data/mascot-landmarks.ts)
const LANDMARKS = {
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
  au: { country: 'Australia', landmark: 'Sydney Opera House silhouette' },
  nz: { country: 'New Zealand', landmark: 'Sky Tower Auckland silhouette' },
  fj: { country: 'Fiji', landmark: 'tropical palm island silhouette' },
  pg: { country: 'Papua New Guinea', landmark: 'Kokoda Trail mountain silhouette' },
  ws: { country: 'Samoa', landmark: 'scenic waterfall silhouette' },
  to: { country: 'Tonga', landmark: "Ha'amonga Trilithon silhouette" },
};

function buildPrompt(country, landmark) {
  return (
    `3D mascot shaped like a SIM card, modern playful style, ` +
    `country: ${country}, wearing subtle flag-inspired colors, ` +
    `holding or standing near a minimal travel icon of ${landmark}, ` +
    `clean soft gradient background, high detail 3D render, ` +
    `brand-consistent, glossy material, front-facing, centered composition`
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateImage(prompt, quality) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality,
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err?.error?.message ?? response.statusText);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let entries = Object.entries(LANDMARKS);

  if (ONLY_ISOS) {
    entries = entries.filter(([iso]) => ONLY_ISOS.includes(iso));
  } else if (FROM_ISO) {
    const idx = entries.findIndex(([iso]) => iso === FROM_ISO);
    if (idx >= 0) entries = entries.slice(idx);
  }

  const total   = entries.length;
  let done      = 0;
  let skipped   = 0;
  const failed  = [];

  console.log(`\nSimsy Mascot Generator — DALL-E 3 (${QUALITY})`);
  console.log(`Countries to process: ${total}`);
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Delay between requests: ${DELAY_MS / 1000}s\n`);

  for (const [iso, { country, landmark }] of entries) {
    const outFile = path.join(OUT_DIR, `${iso}.png`);

    if (fs.existsSync(outFile)) {
      console.log(`[${iso.toUpperCase()}] SKIP — already exists`);
      skipped++;
      continue;
    }

    const prompt = buildPrompt(country, landmark);
    const remaining = total - done - skipped;
    const etaSec = remaining * (DELAY_MS / 1000);
    const etaMin = Math.ceil(etaSec / 60);

    process.stdout.write(`[${iso.toUpperCase()}] ${country} — generating... (ETA ~${etaMin} min remaining) `);

    try {
      const b64 = await generateImage(prompt, QUALITY);
      const buffer = Buffer.from(b64, 'base64');
      fs.writeFileSync(outFile, buffer);
      done++;
      console.log(`DONE → ${iso}.png`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed.push({ iso, country, error: err.message });
    }

    if (done + skipped < total) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Done:    ${done}`);
  console.log(`Skipped: ${skipped} (already existed)`);
  console.log(`Failed:  ${failed.length}`);
  if (failed.length) {
    console.log('\nFailed countries:');
    failed.forEach(f => console.log(`  [${f.iso}] ${f.country}: ${f.error}`));
    console.log('\nRetry failed:');
    console.log(`  node scripts/generate-mascots-api.js --only=${failed.map(f => f.iso).join(',')}`);
  }
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
