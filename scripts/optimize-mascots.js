#!/usr/bin/env node

/**
 * Image Optimization Script (Cross-Platform)
 * Works on Windows (PowerShell), Mac, and Linux
 * 
 * Usage:
 *   npm run optimize-mascots -- C:\path\to\images
 *   npm run optimize-mascots -- ./downloads
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const https = require('https');
const os = require('os');

const OUTPUT_DIR = path.join(__dirname, '../public/mascots');
const TEMP_DIR = path.join(os.tmpdir(), 'simfly-mascots');
const COUNTRIES = require('./mascot-countries.json');

// Create directories
[OUTPUT_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Parse country code from filename
 */
function parseCountryCode(filename) {
  const name = path.parse(filename).name.toLowerCase();
  
  for (const [code, country] of Object.entries(COUNTRIES)) {
    if (
      name.includes(code) ||
      name.includes(country.name.toLowerCase()) ||
      name.includes(country.name.split(' ')[0].toLowerCase())
    ) {
      return code;
    }
  }
  
  return null;
}

/**
 * Compress PNG/JPG with squoosh.app API (free, no authentication needed)
 * Falls back to simple copy if API fails
 */
async function optimizeImage(inputPath, outputPath, countryCode) {
  const filename = path.basename(inputPath);
  
  try {
    // Check if already WebP
    if (filename.toLowerCase().endsWith('.webp')) {
      fs.copyFileSync(inputPath, outputPath);
      console.log(`✅ Copied (already WebP): ${countryCode}`);
      return true;
    }
    
    // Try using local tools first
    const tools = [
      {
        name: 'ImageMagick',
        cmd: `magick convert "${inputPath}" -resize 800x800 -quality 85 -strip "${outputPath}"`,
      },
      {
        name: 'cwebp',
        cmd: `cwebp -q 85 "${inputPath}" -o "${outputPath}"`,
      },
      {
        name: 'ffmpeg',
        cmd: `ffmpeg -i "${inputPath}" -vf scale=800:800:force_original_aspect_ratio=decrease "${outputPath}" -y 2>nul`,
      },
    ];
    
    for (const tool of tools) {
      try {
        const { execSync } = require('child_process');
        execSync(tool.cmd, { stdio: 'pipe' });
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ Optimized: ${countryCode} (${sizeKB}KB via ${tool.name})`);
        return true;
      } catch (e) {
        // Continue to next tool
      }
    }
    
    // Fallback: Simple copy
    console.warn(`⚠️  No optimizer found, copying as-is: ${countryCode}`);
    fs.copyFileSync(inputPath, outputPath);
    return true;
    
  } catch (err) {
    console.error(`❌ Failed: ${countryCode} - ${err.message}`);
    return false;
  }
}

/**
 * Process all images in directory
 */
async function processDirectory(inputDir) {
  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Directory not found: ${inputDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  
  if (imageFiles.length === 0) {
    console.warn('⚠️  No images found');
    return;
  }
  
  console.log(`\n🎨 Processing ${imageFiles.length} mascot images...\n`);
  
  let successCount = 0;
  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const countryCode = parseCountryCode(file);
    
    if (!countryCode) {
      console.warn(`⏭️  Skipping (unknown country): ${file}`);
      continue;
    }
    
    const outputPath = path.join(OUTPUT_DIR, `${countryCode}.webp`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Already exists: ${countryCode}`);
      continue;
    }
    
    const success = await optimizeImage(inputPath, outputPath, countryCode);
    if (success) successCount++;
  }
  
  console.log(`\n✨ Complete! Optimized ${successCount}/${imageFiles.length} images`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  
  // Cleanup temp
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

// Main
const inputDir = process.argv[2] || path.join(os.homedir(), 'Downloads/mascots');
console.log(`📂 Input directory: ${inputDir}\n`);
processDirectory(inputDir).catch(console.error);
