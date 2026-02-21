# Mascot Generation Instructions

## Quick Start

You have 113 prompts ready to generate!

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
2. Save all images to: C:\Users\x\simfly-me\generated-mascots\
3. Run: npm run optimize-mascots -- generated-mascots
4. Images auto-organized and deployed! ✨

## Naming Convention

Save images with country name or ISO code:
- Germany.png → de.webp ✅
- FR_mascot.jpg → fr.webp ✅
- japan_character.png → jp.webp ✅

Script auto-detects from filename!

---

Generated: 2026-02-21T22:51:20.008Z
Total prompts: 113
