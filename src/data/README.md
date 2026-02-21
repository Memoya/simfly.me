# eSIM Device Compatibility Database

Diese JSON-Datei enthält eine umfassende Liste aller bekannten eSIM-fähigen Smartphones und Tablets.

## Struktur

```json
{
  "devices": [
    {
      "brand": "Markenname",
      "models": ["Modell 1", "Modell 2", ...]
    }
  ],
  "lastUpdated": "YYYY-MM-DD"
}
```

## Aktuell unterstützte Marken

- Apple (iPhones, iPads)
- Samsung (Galaxy S, Z Fold/Flip Serie)
- Google (Pixel Serie)
- Xiaomi (inkl. Redmi)
- Oppo (inkl. Find, Reno)
- OnePlus
- Motorola (inkl. Razr)
- Sony (Xperia)
- Honor
- Huawei
- Vivo
- Realme
- Asus (ROG Phone, Zenfone)
- Nothing
- Fairphone

## Neue Geräte hinzufügen

Um neue Geräte hinzuzufügen:

1. Öffne `esim-devices.json`
2. Füge das Modell zum entsprechenden Marken-Array hinzu
3. Aktualisiere das `lastUpdated` Datum
4. Teste die Suche in der Kompatibilitätsprüfung

## Quellen für Updates

- Offizielle Hersteller-Websites
- GSMArena.com (eSIM-Filter)
- GSMA eSIM Device Database
- Community-Feedback

## Automatische Erkennung

Die Komponente `CompatibilityCheck.tsx` erkennt automatisch:
- iPhone-Modelle via User Agent
- iPad-Modelle
- Samsung Galaxy Geräte (via SM-S926, SM-S916, etc.)
- Google Pixel Geräte
- Weitere Marken über User Agent Patterns

Die Erkennung kann in der `detectDevice()` Funktion erweitert werden.
