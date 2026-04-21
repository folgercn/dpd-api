# DPD API and Chrome Extension

Next.js backend plus a Chrome extension for parsing pasted Excel shipment rows with AI and filling myDPD Business forms.

## Current Flow

1. Paste one or more Excel rows into the Chrome extension popup.
2. The popup calls `POST /api/parse-address`.
3. The API calls OpenRouter with `google/gemini-3-flash-preview` and returns structured shipment data.
4. The popup previews parsed rows.
5. The selected row is sent to `content.js`, which fills the active DPD page.

## Environment

Create `.env.local` in the project root:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-3-flash-preview
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=DPD Address Parser
START_SHIPMENT_WORKER=false
```

`START_SHIPMENT_WORKER=false` keeps the older Playwright shipment worker disabled during local development. The Chrome extension flow does not need that worker.

## Development

```bash
npm install
npm run dev
```

The API runs at:

```text
http://localhost:3000/api/parse-address
```

If `.env.local`, `next.config.ts`, or dependencies change, restart `npm run dev`. Normal API and extension source edits can be reloaded without restarting Next.js.

## Chrome Extension

Load the unpacked extension from:

```text
/Users/fujun/node/dpd-api/src/extension
```

In Chrome:

```text
chrome://extensions -> Developer mode -> Load unpacked
```

Reload rules:

- `popup.html` / `popup.js`: close and reopen the popup.
- `content.js` / `manifest.json`: reload the extension, then refresh the DPD page.

## Supported DPD Pages

### Under 20kg

```text
https://business.dpd.de/auftragsstart/auftrag-starten.aspx
```

Current mapping:

- Upper `Absender / LabelAddress` block: customer address parsed from Excel.
- Lower `Empfänger / ShipAddress` block: fixed warehouse address.
- Parcel section: weight, optional dimensions, and reference.

Fixed warehouse:

```text
EXPO Service GmbH
Hua Zhang
Darmstädter Str. 117
64319 Pfungstadt
Germany / DEU
zhhh6489@gmail.com
+49 (0)15257038155
```

### Over 20kg / Return

```text
https://business.dpd.de/retouren/retoure-beauftragen.aspx
```

Current mapping:

- Customer country
- Customer postcode
- Customer email
- Parcel weight
- Reference 1

The return address is selected from the DPD account address book.

## Verification

Useful local checks:

```bash
npx tsc --noEmit
node --check src/extension/popup.js
node --check src/extension/content.js
npm run build
```

`npm run lint` currently fails in the existing ESLint/Next config compatibility layer with a circular structure error before it reaches project code.
