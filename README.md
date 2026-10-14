# Reddit – Nur Text

Firefox-Add-on, das auf Reddit nur Text-Posts zeigt. Bilder, Videos, Galerien und Werbung werden ausgeblendet.

**Installieren:** [Reddit – Nur Text bei addons.mozilla.org](https://addons.mozilla.org/de/firefox/addon/reddit-nur-text/)

## Funktionen

- **Filter:** nur Text-Posts (optional auch Link-Posts), keine Bilder, Videos, Galerien oder Werbung; Kommentare mit Bildern oder Videos werden auf jeder Ebene eingeklappt (Antworten bleiben sichtbar, Klick zeigt den Kommentar)
- **Minimal-Ansicht:** keine Seitenleisten, Logos, Subreddit-Icons, Beitreten-Knopf, Flair-Emojis, Profilbilder bei Kommentaren, Subreddit-Icon in der Suchleiste und Vote-/Kommentar-/Teilen-Knöpfe; Überschriften so groß wie der Text; Upvotes (↑) und Kommentare als kleine Textzeile
- **Bilder & Videos gar nicht laden:** Firefox blockiert Anfragen an Reddits Bild-/Video-Server (i.redd.it, v.redd.it, preview.redd.it …), Imgur, Giphy und eingebettete Player (YouTube, X, Streamable, RedGifs, Vimeo, TikTok, Instagram) – nur auf Reddit, spart Datenvolumen
- **Reddit-Tracking blockieren:** Statistik-, Fehler- und Ereignis-Meldungen an Reddit werden nicht gesendet
- **„Nur Text-Posts“-Link** auf Subreddit-Feeds: führt zur Suche mit `self:yes`, dort schickt der Server nur Text-Posts
- Funktioniert auf www.reddit.com und old.reddit.com
- Alle Funktionen einzeln schaltbar über das Symbol in der Symbolleiste
- Sparsam: jedes Element wird nur einmal bearbeitet, nach dem Laden nur neu eingefügte Teile der Seite

## Aufbau

| Datei | Zweck |
| --- | --- |
| `extension/manifest.json` | Beschreibung des Add-ons |
| `extension/filter.css` | blendet Medien-Posts und Werbung aus |
| `extension/minimal.css` | Minimal-Ansicht |
| `extension/content.js` | setzt die Einstellungen um, Shadow-DOM-Styles, Upvote-/Kommentarzeile, Medien-Kommentare, „Nur Text-Posts“-Link |
| `extension/background.js` | schaltet die Blockierregeln passend zu den Schaltern ein und aus |
| `extension/rules.json` | Blockierregeln für Bilder, Videos und eingebettete Player |
| `extension/rules-tracking.json` | Blockierregeln für Reddit-Tracking |
| `extension/popup.html`, `popup.js` | Menü in der Symbolleiste |

## Testen

`about:debugging#/runtime/this-firefox` → „Temporäres Add-on laden…“ → `extension/manifest.json`

## Veröffentlichen

1. Version in `extension/manifest.json` erhöhen
2. `./build.ps1` ausführen → `dist/reddit-nur-text-<version>.xpi`
3. Auf addons.mozilla.org beim Add-on „Neue Version hochladen“ → „Auf dieser Website“
4. Nach der Freigabe bekommen alle Nutzer das Update automatisch

Add-on-ID: `reddit-nur-text@local`
