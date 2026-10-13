# Reddit – Nur Text

Firefox-Add-on, das auf Reddit nur Text-Posts zeigt. Bilder, Videos, Galerien und Werbung werden ausgeblendet.

**Installieren:** [Reddit – Nur Text bei addons.mozilla.org](https://addons.mozilla.org/de/firefox/addon/reddit-nur-text/)

## Funktionen

- **Filter:** nur Text-Posts (optional auch Link-Posts), keine Bilder, Videos, Galerien oder Werbung; Kommentare mit Bildern oder Videos werden eingeklappt
- **Minimal-Ansicht:** keine Seitenleisten, Logos, Subreddit-Icons, Beitreten-Knopf, Flair-Emojis, Profilbilder bei Kommentaren, Subreddit-Icon in der Suchleiste und Vote-/Kommentar-/Teilen-Knöpfe; Überschriften so groß wie der Text; Upvotes (↑) und Kommentare als kleine Textzeile
- Funktioniert auf www.reddit.com und old.reddit.com
- Filter und Minimal-Ansicht unabhängig voneinander schaltbar über das Symbol in der Symbolleiste

## Aufbau

| Datei | Zweck |
| --- | --- |
| `extension/manifest.json` | Beschreibung des Add-ons |
| `extension/filter.css` | blendet Medien-Posts und Werbung aus |
| `extension/minimal.css` | Minimal-Ansicht |
| `extension/content.js` | setzt die Einstellungen um, Shadow-DOM-Styles, Punkte-/Kommentarzeile |
| `extension/popup.html`, `popup.js` | Menü in der Symbolleiste |

## Testen

`about:debugging#/runtime/this-firefox` → „Temporäres Add-on laden…“ → `extension/manifest.json`

## Veröffentlichen

1. Version in `extension/manifest.json` erhöhen
2. `./build.ps1` ausführen → `dist/reddit-nur-text-<version>.xpi`
3. Auf addons.mozilla.org beim Add-on „Neue Version hochladen“ → „Auf eigene Faust“
4. Signierte Datei herunterladen und installieren bzw. weitergeben

Add-on-ID: `reddit-nur-text@local`
