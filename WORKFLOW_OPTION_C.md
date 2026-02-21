# 🎨 Mascot Generation Workflow - Option C

## 🚀 Schritt-für-Schritt Anleitung

### 1️⃣ **Prompts exportieren**
```powershell
npm run export-mascots
```

Erzeugt Dateien in `prompts-export/`:
- ✅ `mascot-prompts-dalle3.txt` - Für DALL-E 3
- ✅ `mascot-prompts-midjourney.txt` - Für Midjourney
- ✅ `mascot-prompts.json` - Für APIs
- ✅ `mascot-prompts.csv` - Für Google Sheets

---

### 2️⃣ **Wähle dein AI-Tool**

#### 🟢 **DALL-E 3** (kostenlos, am einfachsten)
```
1. Öffne: https://chat.openai.com/
2. Kopiere 1-2 Prompts aus: prompts-export/mascot-prompts-dalle3.txt
3. Generiere Bilder
4. Speichere als PNG
5. Wiederhole für alle Länder
```

#### 🟣 **Midjourney** (beste Qualität)
```
1. Öffne Midjourney Discord
2. Kopiere: prompts-export/mascot-prompts-midjourney.txt
3. Füge Prompts einzeln ein:
   /imagine [PROMPT HERE]
4. React mit ✅ um Bilder zu speichern
5. Download Button → PNG speichern
```

#### 🟡 **Leonardo.ai** (schnell, batch möglich)
```
1. Login: https://leonardo.ai/
2. Model: "PhotoReal"
3. Kopiere Prompts aus: prompts-export/mascot-prompts.txt
4. Batch Generation (bis zu 10 gleichzeitig)
5. Download alle als PNG
```

#### 🟠 **Gemini/Google** (experimentell)
```
1. Google Gemini: https://gemini.google.com/
2. Kopiere Prompt 
3. Frage: "Generate this mascot image: [PROMPT]"
4. Screenshot/Save
```

---

### 3️⃣ **Ordner erstellen**
```powershell
mkdir "$env:USERPROFILE\simfly-me\generated-mascots"
```

---

### 4️⃣ **Bilder speichern**

Nach Generierung: **Alle Bilder in `generated-mascots/` speichern**

```
generated-mascots/
├── Germany.png          ← Auto erkannt als: de.webp
├── france_char.jpg      ← Auto erkannt als: fr.webp
├── JP_mascot.png        ← Auto erkannt als: jp.webp
├── United_States.png    ← Auto erkannt als: us.webp
├── Brazil.jpg           ← Auto erkannt als: br.webp
└── ... (alle anderen)
```

Das Script erkennt automatisch die ISO-Codes aus den Dateinamen! ✨

---

### 5️⃣ **Ansehen & Überprüfen**

Öffne den Ordner und schaue dir die Bilder an:
```powershell
explorer "$env:USERPROFILE\simfly-me\generated-mascots"
```

**Checkliste pro Bild:**
- ✅ Gelbes SIM-Karten-Maskottchen?
- ✅ Große blaue Augen & Lächeln?
- ✅ Landesflagge sichtbar?
- ✅ Wahrzeichen im Hintergrund?
- ✅ Jordan Sneakers?
- ✅ Gesamtqualität OK?

---

### 6️⃣ **Batch-Optimierung**

Wenn alles OK ist, verarbeite alle Bilder:

```powershell
cd C:\Users\x\simfly-me
npm run optimize-mascots -- ./generated-mascots
```

Das Script wird automatisch:
- ✅ ISO-Codes aus Dateinamen auslesen (Germany.png → de)
- ✅ Zu WebP konvertieren (optimal)
- ✅ Auf 800x800px resizen
- ✅ Optimieren (Qualität 85%)
- ✅ In `public/mascots/` speichern
- ✅ Bereit zum Deployen!

---

### 7️⃣ **Ergebnis überprüfen**

```powershell
ls public/mascots/

# Sollte zeigen:
# de.webp, fr.webp, jp.webp, gb.webp, us.webp, br.webp, au.webp, ...
```

---

### 8️⃣ **Deployen**

```powershell
git add public/mascots/
git commit -m "feat: Add 100+ country mascots"
git push

# Vercel deployed automatisch! 🚀
```

---

## ⏱️ Zeitaufwand

| Schritt | Zeit | Bemerkung |
|---------|------|----------|
| 1. Export | 1 Min | Automatisch |
| 2. Generierung | 2-6 Std | Je nach Tool & Anzahl |
| 3. Review | 30 Min | Bilder anschauen |
| 4. Optimierung | 5 Min | Automatisch |
| 5. Deploy | 2 Min | Git + Vercel |
| **Total** | **3-7 Std** | Größtenteils automated |

---

## 💡 Tipps für beste Ergebnisse

### DALL-E 3
- Generiere **tagsüber** (beste Qualität)
- Nutze **HD-Modus** wenn verfügbar
- Format: **Square (1:1)**

### Midjourney
- Nutze `--q 1` für schneller, `--q 2` für besser
- `--s 750` für perfekte Details
- Batch generate in Discord-Threads

### Leonardo.ai
- **PhotoReal** model ist am besten
- Wähle **"HD"** für 1024x1024
- Alchemy **enabled** für bessere Details

---

## ❌ Wenn etwas schiefgeht

### "Bild wird nicht erkannt"
→ Benenne um: `Germany.png` statt `germany mascot.png`

### "Conversion fehlgeschlagen"
→ Installiere ImageMagick: `choco install imagemagick`

### "Falsche Farben/Design"
→ Regeneriere mit angepasstem Prompt

---

## 📋 Checkliste

- [ ] 1. `npm run export-mascots` ✅
- [ ] 2. AI-Tool gewählt
- [ ] 3. Prompts kopiert & Bilder generiert
- [ ] 4. In `generated-mascots/` gespeichert
- [ ] 5. Bilder überprüft
- [ ] 6. `npm run optimize-mascots -- ./generated-mascots`
- [ ] 7. `public/mascots/` überprüft
- [ ] 8. `git push`
- [ ] 9. Vercel deployed ✨

---

**Fragen?** Check `MASCOT_PROCESSING_GUIDE.md` oder `MASCOT_PROMPTS.md`!
