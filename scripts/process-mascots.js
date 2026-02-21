#!/usr/bin/env node

/**
 * Mascot Image Processing Script
 * Batch converts, optimizes, and organizes mascot images
 * 
 * Usage:
 *   node scripts/process-mascots.js input-folder
 * 
 * Example:
 *   node scripts/process-mascots.js ./downloads/mascots
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Define the output directory
const OUTPUT_DIR = path.join(__dirname, '../public/mascots');
const COUNTRIES = require('./mascot-countries.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse country name from filename
 * Supports patterns like:
 *   - "Germany.png" → "de"
 *   - "DE_mascot.png" → "de"
 *   - "france-character.webp" → "fr"
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
 * Convert image to WebP with optimization
 */
async function convertToWebP(inputPath, outputPath) {
  const commands = [
    // Using ImageMagick (convert/magick)
    `magick convert "${inputPath}" -resize 800x800 -quality 85 -strip "${outputPath}"`,
    // Fallback: Using ImageMagick alternate syntax
    `convert "${inputPath}" -resize 800x800 -quality 85 -strip "${outputPath}"`,
    // Using ffmpeg as fallback
    `ffmpeg -i "${inputPath}" -vf "scale=800:800:force_original_aspect_ratio=decrease" "${outputPath}" -y`,
  ];
  
  for (const cmd of commands) {
    try {
      await execAsync(cmd);
      console.log(`✅ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
      return true;
    } catch (err) {
      // Continue to next command
      continue;
    }
  }
  
  throw new Error(`Failed to convert ${inputPath}: No image processor available (install ImageMagick or ffmpeg)`);
}

/**
 * Process single image file
 */
async function processImage(inputPath) {
  try {
    const filename = path.basename(inputPath);
    const countryCode = parseCountryCode(filename);
    
    if (!countryCode) {
      console.warn(`⚠️  Could not identify country: ${filename}`);
      return false;
    }
    
    const outputPath = path.join(OUTPUT_DIR, `${countryCode}.webp`);
    
    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping (already exists): ${countryCode}`);
      return true;
    }
    
    // Convert and optimize
    await convertToWebP(inputPath, outputPath);
    
    // Log file size
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   📦 Size: ${sizeKB} KB | Country: ${COUNTRIES[countryCode].name}`);
    
    return true;
  } catch (err) {
    console.error(`❌ Error processing ${path.basename(inputPath)}: ${err.message}`);
    return false;
  }
}

/**
 * Process all images in directory
 */
async function processDirectory(inputDir) {
  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Input directory not found: ${inputDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  
  if (imageFiles.length === 0) {
    console.warn('⚠️  No image files found in directory');
    return;
  }
  
  console.log(`\n🎨 Processing ${imageFiles.length} mascot images...\n`);
  
  let successCount = 0;
  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const success = await processImage(inputPath);
    if (success) successCount++;
  }
  
  console.log(`\n✨ Complete! Processed ${successCount}/${imageFiles.length} images`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
}

// Main
const inputDir = process.argv[2] || './downloads/mascots';
processDirectory(inputDir).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
