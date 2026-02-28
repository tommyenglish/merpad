# Merpad

*A pocket‑sized Mermaid editor & viewer you can run anywhere.*

Merpad is a single‑page app for writing, previewing, and exporting Mermaid diagrams—no build chain, no login, no cloud service.
Drop it on a USB stick, serve it from `http://localhost`, or host the **static** files behind your company firewall and you're up and sketching in seconds.

---

## ✨ Features

|                        |                                                              |
| ---------------------- | ------------------------------------------------------------ |
| **Live preview**       | Auto-renders as you type (400ms debounce) with Dagre **or** ELK layouts (Hierarchical · Adaptive/layered · Tree · Radial). |
| **Tabs**               | Work on multiple diagrams at once with tabbed editing. Tabs persist across sessions via localStorage. |
| **Templates**          | Start fast with built-in templates: Flowchart, Sequence, Gantt, Class, ER Diagram, State, Pie, Git Graph, Journey. |
| **Themes**             | Default · Dark · Forest · Neutral · Vibrant (custom) · Print (B/W). |
| **Zoom & dimensions**  | Zoom in/out/reset buttons, plus editable width and height inputs that maintain aspect ratio. |
| **Panning**            | Click and drag to pan around the diagram area. |
| **Resizable split**    | Drag the divider to resize editor vs. diagram. Toggle between horizontal and vertical layout. |
| **Line numbers**       | Editor shows line numbers that scroll in sync with your code. |
| **Save / Open**        | File System Access API saves your `.mmd` file in place; falls back to download/upload if not supported. |
| **One-click export**   | Download **SVG** or **PNG** (with theme-appropriate background) · Copy PNG straight to clipboard. |
| **100% offline**       | All assets live in the repo -- no CDN calls. Works over `http://localhost`. |
| **Zero build tools**   | Serve the `public/` folder as-is with any static server. |

---

## 🔧 Quick start

```bash
# 1 · Clone
git clone https://github.com/tommyenglish/merpad.git
cd merpad

# 2 · Install deps (REQUIRED - copies Mermaid & ELK assets into public/)
npm install

# 3 · Run a tiny server (http://localhost:8000)
npm run dev
```

**Important:** `npm install` is required even if you're not developing. It runs a postinstall script that copies the Mermaid library files and chunks from `node_modules/` into `public/`. Without this step, the app won't work.

No Node? You'll need Node just for the initial `npm install`, then you can use any static server (`python -m http.server 8000 -d public`, `npx serve public`, VS Code Live‑Server).

---

## 🖱️ Usage

| Action       | How                                                          |
| ------------ | ------------------------------------------------------------ |
| **Edit**     | Type Mermaid syntax in the editor. Diagrams auto-render as you type (400ms debounce). |
| **Tabs**     | Click **+** to add a new tab. Pick a template or start blank. Click **x** to close a tab. |
| **Save**     | Save button prompts for file location using the native file picker (or downloads if unsupported). |
| **Open**     | Choose a local `.mmd` / `.txt` file -- opens in a new tab if the current one has content. |
| **Export**   | **SVG** & **PNG** buttons prompt for save location; **Copy** puts PNG on your clipboard. |
| **Zoom**     | **+** / **-** / **Reset** buttons, or type exact pixel dimensions in the width/height inputs. |
| **Pan**      | Click and drag in the diagram area to pan around. |
| **Layout**   | Toggle horizontal/vertical split. Drag the divider to resize. Both persist across sessions. |

---

## 🛠️ Development scripts

```bash
npm run dev       # runs npm run copy, then starts python http.server on port 8000
npm run copy      # copies .mjs entries + chunks from node_modules into public/
```

Viewer logic lives in `public/viewer.js`, styles in `public/viewer.css`.

---

## 🐛 Troubleshooting

**CSP errors or "Loading chunk failed" errors in browser console?**

- If you see errors like `Loading the script 'http://localhost:8000/43.bundle.js' violates...`, this is likely a browser extension interfering with the page.
- Check your Chrome extensions at `chrome://extensions/` and disable any that might inject content scripts.
- Try testing in an incognito window (where extensions are usually disabled).

**Missing files or assets?**

- Make sure you ran `npm install` - this copies required Mermaid assets into `public/`.
- Check that `public/chunks/` directory exists and contains `.mjs` files.

---

## 📄 License

Free for personal, educational, and internal company use. Any resale, hosting, or distribution for profit is prohibited without written permission.

---

## ☕Buy me a coffee

Not required, but much appreciated! [Coffee me here](https://buymeacoffee.com/tommyenglish)
