# Merpad

*A pocket‑sized Mermaid editor & viewer you can run anywhere.*

Merpad is a single‑page app for writing, previewing, and exporting Mermaid diagrams—no build chain, no login, no cloud service.
Drop it on a USB stick, serve it from `http://localhost`, or host the **static** files behind your company firewall and you're up and sketching in seconds.

---

## ✨ Features

|                      |                                                              |
| -------------------- | ------------------------------------------------------------ |
| **Live preview**     | Render on demand with Dagre **or** ELK layouts (Hierarchical · Adaptive/layered · Tree · Radial). |
| **Themes & zoom**    | Switch between built‑ins (Dark / Forest / Neutral / Print) or your own palette. Smooth zoom with live dimension read‑out. |
| **Save / Open**      | File‑System Access API overwrites your ".mmd" file in place; falls back to download/upload if not supported. |
| **One‑click export** | Download **SVG** or **PNG** · Copy PNG straight to clipboard. |
| **100 % offline**    | All assets live in the repo—no CDN calls. Works over `http://localhost`. |
| **Zero build tools** | Serve the *static* folder as‑is **or** bundle into one file with the optional Rollup script. |

---

## 🔧 Quick start

```bash
# 1 · Clone
git clone https://github.com/your-org/merpad.git
cd merpad

# 2 · Install deps (REQUIRED - copies Mermaid & ELK assets into public/)
npm install

# 3 · Run a tiny server (opens http://localhost:8000)
npm run dev
```

**Important:** `npm install` is required even if you're not developing. It runs a postinstall script that copies the Mermaid library files and chunks from `node_modules/` into `public/`. Without this step, the app won't work.

No Node? You'll need Node just for the initial `npm install`, then you can use any static server (`python -m http.server 8000 -d public`, `npx serve public`, VS Code Live‑Server).

---

## 🖱️ Usage

| Action     | How                                                          |
| ---------- | ------------------------------------------------------------ |
| **Render** | Click **Render** or press **Ctrl + Enter**.                  |
| **Save**   | **Save** overwrites the opened file, or prompts if you haven't saved yet. |
| **Open…**  | Choose a local `.mmd` / `.txt` file and Merpad re‑renders immediately. |
| **Export** | **SVG** & **PNG** buttons download; **Copy** puts PNG on your clipboard. |
| **Zoom**   | `＋` / `−` / **100 %**. Size label shows export dimensions.  |

Keyboard shortcuts are listed in the **?** menu in the viewer.

---

## 🛠️ Development scripts

```bash
npm run dev       # python http.server + open browser
npm run copy      # copy .mjs entries + chunks into public/
npm run build     # optional: rollup into single merpad.bundle.js
```

Viewer logic lives in `viewer.js`, styles in `viewer.css`.

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
