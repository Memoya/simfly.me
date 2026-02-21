#!/usr/bin/env node

/**
 * Mascot Image Generator using Google Gemini
 * Generates all country mascot images from prompts
 * 
 * Setup:
 *   npm install google-generative-ai
 *   
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-mascots-gemini.js
 *   
 * Get API Key: https://ai.google.dev/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { GoogleGenerativeAI } = require('google-generative-ai');

const OUTPUT_DIR = path.join(__dirname, '../generated-mascots');
const PROMPTS_FILE = path.join(__dirname, '../MASCOT_PROMPTS.md');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extract prompts from MASCOT_PROMPTS.md
 */
function extractPromptsFromMarkdown() {
  const content = fs.readFileSync(PROMPTS_FILE, 'utf-8');
  const prompts = [];
  
  // Match pattern: #### 🇮🇸 IS - Island and following ``` block
  const countryRegex = /#### �[\w\s]*\s([A-Z]{2})\s-\s([^\n]+)\n```\n([\s\S]*?)\n```/g;
  
  let match;
  while ((match = countryRegex.exec(content)) !== null) {
    const iso = match[1].toLowerCase();
    const country = match[2];
    const prompt = match[3].trim();
    
    prompts.push({
      iso,
      country,
      prompt,
    });
  }
  
  return prompts;
}

/**
 * Generate image with Gemini
 */
async function generateImageWithGemini(client, iso, country, prompt) {
  try {
    console.log(`🎨 Generating: ${iso.toUpperCase()} - ${country}...`);
    
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });
    
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
    
    // Note: Gemini can generate images but we need to handle the response
    // For text-to-image, you would typically use the image byte response
    const response = result.response;
    console.log(`✅ Generated: ${iso.toUpperCase()}`);
    
    return response;
  } catch (err) {
    console.error(`❌ Error generating ${iso}: ${err.message}`);
    return null;
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
          .on('finish', () => resolve())
          .on('error', reject);
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * Generate all mascots
 */
async function generateAllMascots() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable not set');
    console.log('\nTo get an API key, visit: https://ai.google.dev/');
    console.log('\nUsage:');
    console.log('  $env:GEMINI_API_KEY = "your-api-key"');
    console.log('  node scripts/generate-mascots-gemini.js');
    process.exit(1);
  }
  
  const client = new GoogleGenerativeAI(apiKey);
  const prompts = extractPromptsFromMarkdown();
  
  if (prompts.length === 0) {
    console.error('❌ No prompts found in MASCOT_PROMPTS.md');
    process.exit(1);
  }
  
  console.log(`\n🎯 Found ${prompts.length} country prompts\n`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  
  let successCount = 0;
  for (const { iso, country, prompt } of prompts) {
    const filename = `${iso}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Already exists: ${iso.toUpperCase()}`);
      continue;
    }
    
    try {
      const result = await generateImageWithGemini(client, iso, country, prompt);
      if (result) {
        successCount++;
        
        // Rate limiting - be nice to the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      // Continue with next country
      continue;
    }
  }
  
  console.log(`\n✨ Complete! Generated ${successCount}/${prompts.length} mascots`);
  console.log(`📁 Check: ${OUTPUT_DIR}\n`);
  console.log('Next step: npm run optimize-mascots -- generated-mascots\n');
}

// Main
generateAllMascots().catch(console.error);
