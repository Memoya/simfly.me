#!/usr/bin/env node

/**
 * Mascot Prompt Exporter
 * Exportiert alle Prompts in verschiedene Formate für Batch-Generierung
 * 
 * Unterstützte Formate:
 *   - CSV (für Google Sheets, Excel)
 *   - JSON (für APIs)
 *   - TXT (einfache Liste)
 *   - JSONL (für Midjourney Batch API)
 * 
 * Usage:
 *   node scripts/export-mascot-prompts.js [format]
 *   node scripts/export-mascot-prompts.js csv
 *   node scripts/export-mascot-prompts.js json
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_FILE = path.join(__dirname, '../MASCOT_PROMPTS.md');
const OUTPUT_BASE = path.join(__dirname, '../prompts-export');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_BASE)) {
  fs.mkdirSync(OUTPUT_BASE, { recursive: true });
}

/**
 * Extract prompts from MASCOT_PROMPTS.md
 */
function extractPromptsFromMarkdown() {
  const fileContent = fs.readFileSync(PROMPTS_FILE, 'utf-8');
  const prompts = [];
  
  // Debug: Show number of lines and a snippet
  const lines = fileContent.split('\n');
  console.log(`📄 File has ${lines.length} lines`);
  
  // Match pattern: #### [stuff] XX - Country on one line, then ``` block, then content
  // Split by #### to find headers
  const sections = fileContent.split('#### ');
  
  for (let i = 1; i < sections.length; i++) {  // Start from 1 to skip intro
    const section = sections[i];
    const lines = section.split('\n');
    
    // First line should be: 🇩🇪 DE - Deutschland (or similar)
    const headerLine = lines[0];
    const isoMatch = headerLine.match(/([A-Z]{2})\s-\s/);
    
    if (!isoMatch) continue;
    
    const iso = isoMatch[1].toLowerCase();
    const country = headerLine.split(' - ')[1]?.split('\n')[0] || 'Unknown';
    
    // Find the code block (between ``` markers)
    let inCodeBlock = false;
    let prompt = [];
    
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      
      if (line.includes('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          continue;
        } else {
          break;  // End of code block
        }
      }
      
      if (inCodeBlock) {
        prompt.push(line);
      }
    }
    
    const promptText = prompt.join('\n').trim();
    if (promptText.length > 10) {
      prompts.push({
        iso,
        country: country.trim(),
        prompt: promptText,
      });
    }
  }
  
  return prompts;
}

/**
 * Export to CSV
 */
function exportCSV(prompts) {
  const csvContent = [
    'ISO,Country,Prompt',
    ...prompts.map(p => 
      `"${p.iso}","${p.country}","${p.prompt.replace(/"/g, '""')}"`
    ),
  ].join('\n');
  
  const filepath = path.join(OUTPUT_BASE, 'mascot-prompts.csv');
  fs.writeFileSync(filepath, csvContent);
  console.log(`✅ Exported CSV: ${filepath}`);
  console.log(`   ${prompts.length} prompts ready for Google Sheets, Excel, etc.`);
}

/**
 * Export to JSON
 */
function exportJSON(prompts) {
  const filepath = path.join(OUTPUT_BASE, 'mascot-prompts.json');
  fs.writeFileSync(filepath, JSON.stringify(prompts, null, 2));
  console.log(`✅ Exported JSON: ${filepath}`);
  console.log(`   Use with any API or custom tool`);
}

/**
 * Export to JSONL (one JSON object per line)
 */
function exportJSONL(prompts) {
  const jsonlContent = prompts
    .map(p => JSON.stringify(p))
    .join('\n');
  
  const filepath = path.join(OUTPUT_BASE, 'mascot-prompts.jsonl');
  fs.writeFileSync(filepath, jsonlContent);
  console.log(`✅ Exported JSONL: ${filepath}`);
  console.log(`   Streamable format for batch processing`);
}

/**
 * Export to TXT (simple list)
 */
function exportTXT(prompts) {
  const txtContent = prompts
    .map(p => `[${p.iso.toUpperCase()} - ${p.country}]\n${p.prompt}\n`)
    .join('\n---\n\n');
  
  const filepath = path.join(OUTPUT_BASE, 'mascot-prompts.txt');
  fs.writeFileSync(filepath, txtContent);
  console.log(`✅ Exported TXT: ${filepath}`);
  console.log(`   Copy-paste friendly format`);
}

/**
 * Export for Midjourney
 */
function exportMidjourney(prompts) {
  const mjContent = prompts
    .map(p => `${p.prompt} --v 6 --ar 1:1 --style raw --q 2`)
    .join('\n\n');
  
  const filepath = path.join(OUTPUT_BASE, 'mascot-prompts-midjourney.txt');
  fs.writeFileSync(filepath, mjContent);
  console.log(`✅ Exported Midjourney: ${filepath}`);
  console.log(`   Ready to paste into Midjourney (one per line)`);
}

/**
 * Export for DALL-E 3
 */
function exportDALLE(prompts) {
  const dalleContent = prompts
    .map(p => `${p.iso.toUpperCase()} - ${p.country}\n${p.prompt}`)
    .join('\n\n---\n\n');
  
  const filepath = path.join(OUTPUT_BASE, 'mascot-prompts-dalle3.txt');
  fs.writeFileSync(filepath, dalleContent);
  console.log(`✅ Exported DALL-E 3: ${filepath}`);
  console.log(`   One country per prompt in DALL-E UI`);
}

/**
 * Create master file with instructions
 */
function createInstructions(prompts) {
  const instructions = `# Mascot Generation Instructions

## Quick Start

You have ${prompts.length} prompts ready to generate!

### Option 1: Midjourney (Best Quality)
1. Copy content from: mascot-prompts-midjourney.txt
2. In Midjourney Discord, paste one line at a time
3. Save images when generated
4. Organize in: generated-mascots/

### Option 2: DALL-E 3 (Free)
1. Use: mascot-prompts-dalle3.txt
2. Paste prompts into https://openai.com/dall-e-3/
3. Generate images (batch generation available)
4. Save as PNG/JPG to: generated-mascots/

### Option 3: Leonardo.ai (Fast)
1. Use: mascot-prompts.txt or mascot-prompts.json
2. Settings: PhotoReal model, 1024x1024
3. Batch generation (up to 10 parallel)
4. Save to: generated-mascots/

### Option 4: Hugging Face (Free)
1. Use API with: mascot-prompts.json
2. Easy integration for batch processing
3. Save outputs to: generated-mascots/

## File Formats Included

- **mascot-prompts.csv** - Import to Google Sheets, Excel
- **mascot-prompts.json** - For APIs and custom scripts
- **mascot-prompts.jsonl** - Streaming format
- **mascot-prompts-midjourney.txt** - Midjourney format
- **mascot-prompts-dalle3.txt** - DALL-E 3 friendly
- **mascot-prompts.txt** - Simple text format

## Next Steps

1. Generate images using your preferred tool
2. Save all images to: C:\\Users\\x\\simfly-me\\generated-mascots\\
3. Run: npm run optimize-mascots -- generated-mascots
4. Images auto-organized and deployed! ✨

## Naming Convention

Save images with country name or ISO code:
- Germany.png → de.webp ✅
- FR_mascot.jpg → fr.webp ✅
- japan_character.png → jp.webp ✅

Script auto-detects from filename!

---

Generated: ${new Date().toISOString()}
Total prompts: ${prompts.length}
`;

  fs.writeFileSync(path.join(OUTPUT_BASE, 'README.txt'), instructions);
  console.log(`✅ Created: ${OUTPUT_BASE}/README.txt`);
}

// Main
console.log(`\n📤 Exporting ${path.basename(PROMPTS_FILE)} prompts...\n`);

const prompts = extractPromptsFromMarkdown();

if (prompts.length === 0) {
  console.error('❌ No prompts found. Check MASCOT_PROMPTS.md');
  process.exit(1);
}

console.log(`Found: ${prompts.length} country prompts\n`);

// Export all formats
exportCSV(prompts);
exportJSON(prompts);
exportJSONL(prompts);
exportTXT(prompts);
exportMidjourney(prompts);
exportDALLE(prompts);
createInstructions(prompts);

console.log(`\n📁 All files exported to: ${OUTPUT_BASE}\n`);
console.log('Next: Choose your generation tool and start generating! 🎨\n');
