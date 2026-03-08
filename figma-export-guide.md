# AnimeVerse → Figma Export Guide

Use this to recreate the app’s design in Figma or to hand off to designers.

---

## How to convert web pages to Figma frames (on your canvas)

The **Figma Desktop MCP** in Cursor only reads from Figma (screenshots, design context); it cannot create frames from URLs. To turn your AnimeVerse pages into Figma frames, use a **Figma plugin** that imports from URL/HTML.

### Step-by-step

1. **Start your app**
   - In the project: `npm run dev`
   - Open the app in the browser (e.g. `http://localhost:5173` or the port shown). Navigate to the screen you want (home, library, a modal, etc.).

2. **In Figma**
   - Open the file where you want the frames.
   - **Plugins** → **Find more plugins** (or **Resources** → **Plugins**).
   - Search for **"html to design"** or **"HTML to Design"** (by html.to.design).
   - Install and run the plugin.

3. **Import the page**
   - In the plugin UI, choose **Import from URL** (or similar).
   - Paste your local URL, e.g. `http://localhost:5173` (or the exact path, e.g. `http://localhost:5173/` with the view you need).
   - Set viewport size if needed (e.g. 1440×900 for desktop).
   - Run the import. The plugin will create a **frame** (and nested layers) on your current page.

4. **Repeat for other screens**
   - Change the URL or route in the app (e.g. open a modal, go to Library), then run the plugin again with the new URL to get another frame. You can also use the plugin’s **Paste HTML** if you copy the HTML of a specific section from DevTools.

**Other plugins to try** (if the above isn’t available): search for **“Screenshot to Figma”** (paste screenshot as image frame) or **“Anima”** / **“Locofy”** for HTML/URL import.

### Using code (this repo): screenshots only

Figma's **REST API is read-only** — no external code can create frames in your file. Only a **Figma plugin** (running inside Figma) can create frames. So "Claude code" (or any script) can't push your webpage directly into Figma as editable frames.

What code *can* do: **capture screenshots** of your app so you can drag them into Figma as image frames.

1. Install: `npm install -D puppeteer`
2. Start the app: `npm run dev`
3. In another terminal: `npm run screenshot:figma`  
   Optional: `node scripts/screenshot-for-figma.mjs http://localhost:5173 1440x900`
4. Screenshots are saved in `figma-screenshots/`. Drag a PNG into Figma or use **Place image** (Ctrl/Cmd + Shift + K) to get it on the canvas as an image frame.

For **editable vector frames** from a URL, you still need a Figma plugin (e.g. html to design) that runs inside Figma.

---

## 1. Design tokens (use in Figma variables / styles)

### Colors
| Token | Hex | Usage |
|-------|-----|--------|
| **Primary** | `#f4258c` | CTAs, links, accents, selection |
| **Background dark** | `#181114` | Main app background (dark mode) |
| **Surface dark** | `#221019` | Cards, modals, elevated surfaces |
| **Accent purple** | `#a855f7` | Secondary accent |
| **Background light** | `#f8f5f7` | Light mode background |

### Typography
- **Font**: Plus Jakarta Sans  
  - [Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Weights used**: 300, 400, 500, 600, 700, 800
- **Display**: `font-display` = Plus Jakarta Sans

### Border radius
- Default: `0.5rem` (8px)
- `lg`: `1rem` (16px)
- `xl`: `1.5rem` (24px)
- Buttons/cards often: `rounded-2xl` (16px), `rounded-3xl` (24px)

### Shadows (Tailwind-style)
- Primary glow: `shadow-primary/20`, `shadow-primary/30`
- Buttons: `shadow-lg shadow-primary/20`

---

## 2. Ways to get the UI into Figma

### A. HTML → Figma plugin (best for layout)
1. In Figma: **Plugins** → **Find more plugins** → search for **"html to design"** or **"html.to.design"**.
2. Run the app locally (`npm run dev`), open the app in the browser.
3. In the plugin, paste the page URL or the HTML of a component/section.
4. The plugin converts the structure into Figma layers so you keep layout and hierarchy.

### B. Screenshots
1. Run `npm run dev` and open the app.
2. Capture full screen or key areas (sidebar, hero, card grid, modals).
3. In Figma: drag the images in or **Place image** (Ctrl/Cmd + Shift + K).
4. Use the design tokens above to recreate exact colors and type if you redraw.

### C. Recreate from tokens
- Create **Figma variables** for the five colors and use them for fills and text.
- Set up **text styles** with Plus Jakarta Sans and the weights above.
- Build frames for: Sidebar, Hero, AnimeCard, LoginModal, AnimeDetailsModal, etc., using the tokens so the design stays in sync with the app.

---

## 3. Key components to export or mock

- **Sidebar** – nav, user area, primary CTA
- **Hero** – gradient overlay, badge, CTA button
- **AnimeCard** – poster, rank badge, title, hover
- **Modals** – Login, Anime Details, Identification (dark surface, primary buttons)
- **TopCharts / MyLibrary** – section headers, filters, cards

---

## 4. Optional: Figma variables (JSON)

You can import this in Figma via **Variables** → **Import** (if your Figma version supports the format) or copy the values manually:

```json
{
  "colors": {
    "primary": "#f4258c",
    "background-dark": "#181114",
    "surface-dark": "#221019",
    "accent-purple": "#a855f7",
    "background-light": "#f8f5f7"
  },
  "fontFamily": "Plus Jakarta Sans",
  "borderRadius": { "DEFAULT": 8, "lg": 16, "xl": 24 }
}
```

---

*Generated from AnimeVerse project. Fix the Figma Desktop MCP in Cursor if you want direct integration later.*
