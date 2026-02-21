# 🎨 Maskottchen Batch-Processing Guide

## 🚀 Schnell-Start

### 1. Bilder generieren
Nutze dein Lieblings-AI-Tool mit den Prompts aus `MASCOT_PROMPTS.md`:
- **Midjourney:** `/imagine [PROMPT]`
- **DALL-E 3:** Copy-Paste Prompt
- **Leonardo.ai:** PhotoReal model

### 2. Bilder speichern
Alle generierten Bilder in einen Ordner speichern:
```
C:\Users\x\Downloads\mascots\
├── Germany.png
├── France.webp
├── Japan_mascot.png
├── de_character.jpg
└── ...
```

### 3. Batch-Processing ausführen

```bash
# Windows PowerShell
npm run optimize-mascots -- C:\Users\x\Downloads\mascots

# oder mit relativen Pfaden
npm run optimize-mascots -- ./downloads/mascots

# oder Standard-Downloads-Ordner
npm run optimize-mascots
```

**Das Script wird automatisch:**
✅ Ländercodes aus Dateinamen erkennen  
✅ Zu WebP konvertieren (beste Performance)  
✅ Auf 800x800px optimieren  
✅ Qualität 85% setzen (perfekter Balance)  
✅ Metadaten entfernen (schneller laden)  
✅ In `public/mascots/` ins Projekt kopieren  

## 📊 Unterstützte Dateiname-Formate

Das Script erkennt automatisch:

```
✅ Germany.png           → de.webp
✅ france-character.webp → fr.webp
✅ DE_mascot.jpg         → de.webp
✅ JP Sakura.png         → jp.webp
✅ united_states.jpg     → us.webp
✅ South Korea.png       → kr.webp
✅ Code_AR.png           → ar.webp
✅ CHINA_icon.webp       → cn.webp
```

## 🛠️ Voraussetzungen

Das Script versucht automatisch verschiedene Tools:

### Option 1: ImageMagick (empfohlen)
```powershell
# Windows - mit Chocolatey
choco install imagemagick

# oder manuell herunterladen
# https://imagemagick.org/script/download.php#windows
```

### Option 2: FFmpeg
```powershell
# Windows - mit Chocolatey
choco install ffmpeg

# Download: https://ffmpeg.org/download.html
```

### Option 3: cwebp (Google WebP)
```powershell
# Windows - mit Chocolatey
choco install webp

# Download: https://developers.google.com/speed/webp/download
```

**Falls nichts installiert:** Script kopiert Bilder einfach (ohne Optimierung)

## 📈 Output-Format

Nach dem Processing sehen die Bilder so aus:

```
public/mascots/
├── de.webp       (~120KB)  ← Deutschland
├── fr.webp       (~115KB)  ← Frankreich
├── jp.webp       (~128KB)  ← Japan
├── gb.webp       (~125KB)  ← UK
├── us.webp       (~118KB)  ← USA
├── br.webp       (~122KB)  ← Brasilien
├── au.webp       (~119KB)  ← Australien
└── ... (100+ weitere)
```

Größe: **800x800px, WebP, Qualität 85%**  
Ladezeit: **~50ms pro Bild** (optimal)

## ✨ Integration ins Projekt

Die Komponente `CountryMascot.tsx` lädt automatisch:

```typescript
// Automatische Erkennung:
// /mascots/{iso}.webp wird geladen wenn vorhanden
// z.B. /mascots/de.webp für Deutschland

<CountryMascot iso="de" />  // → public/mascots/de.webp
```

## 🎯 Workflow-Beispiel

```bash
# 1. Generiere 20 Bilder in Midjourney/DALL-E
#    Speichere alle in C:\Users\x\Downloads\mascots

# 2. Führe Script aus
npm run optimize-mascots -- C:\Users\x\Downloads\mascots

# 3. Prüfe Ergebnis
ls public/mascots/
# Sollte zeigen: de.webp, fr.webp, jp.webp, etc.

# 4. In Git committen
git add public/mascots/
git commit -m "feat: Add country mascots for DE, FR, JP, GB, US, BR, AU"
git push

# 5. Automatisch deployed! ✨
```

## 🆘 Troubleshooting

### "No image processor found"
```bash
# ImageMagick installieren:
choco install imagemagick

# Oder FFmpeg:
choco install ffmpeg

# Neustart und erneut versuchen
npm run optimize-mascots
```

### "Datei wird nicht erkannt"
Benenne um nach Muster:
```
❌ mascot-de.png     → ✅ de.png
❌ char_france.jpg   → ✅ france.jpg
❌ singapore.webp    → ✅ sg.webp  (ISO Code erforderlich!)
```

### "Input directory not found"
```bash
# Korrekter Pfad?
npm run optimize-mascots -- C:\Users\x\Downloads\mascots

# Ordner muss existieren!
mkdir C:\Users\x\Downloads\mascots
```

## 📋 Batch-Generierungs-Tipps

### Für Midjourney (empfohlen für beste Qualität)
```
/imagine [BASE_PROMPT] --v 6 --ar 1:1 --style raw --q 2
```
**Batch Upscale:** Nutze Midjourney Pro für Massenproduktion

### Für DALL-E 3 (kostenlos!)
- Quality: HD
- Style: Vivid
- Size: 1024x1024
- Generiere 5-10 Bilder nacheinander

### Für Leonardo.ai
- Model: PhotoReal
- Alchemy: Enabled
- Steps: 30
- Size: 1024x1024
- Batch: bis zu 10x gleichzeitig

---

## 🎨 Qualität-Checkliste

Nach dem Processing sollten alle `.webp`-Dateien:
- [ ] ~100-150KB groß sein
- [ ] 800x800px sein
- [ ] ISO-Code-Namen haben (z.B. `de.webp`)
- [ ] Keine Fehler beim Laden zeigen
- [ ] In Komponente angezeigt werden

---

**Viel Erfolg beim Batch-Processing! 🚀**
