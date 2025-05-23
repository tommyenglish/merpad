# Merpad 

*A pocket‑sized Mermaid editor & viewer you can run anywhere.*

Merpad is a single‑page app for writing, previewing, and exporting Mermaid diagrams—no build chain, no login, no cloud service.  
Drop it on a USB stick, serve it from `http://localhost`, or host the **static** files behind your company firewall and you’re up and sketching in seconds.

---

## ✨ Features

|                      |                                                              |
| -------------------- | ------------------------------------------------------------ |
| **Live preview**     | Render on demand with Dagre **or** ELK layouts (Hierarchical · Adaptive/layered · Tree · Radial). |
| **Themes & zoom**    | Switch between built‑ins (Dark / Forest / Neutral / Print) or your own palette. Smooth zoom with live dimension read‑out. |
| **Save / Open**      | File‑System Access API overwrites your ".mmd" file in place; falls back to download/upload if not supported. |
| **One‑click export** | Download **SVG** or **PNG** · Copy PNG straight to clipboard. |
| **100 % offline**    | All assets live in the repo—no CDN calls. Works over `http://localhost`. |
| **Zero build tools** | Serve the *static* folder as‑is **or** bundle into one file with the optional Rollup script. |

---

## 🔧 Quick start

```bash
# 1 · Clone
git clone https://github.com/your-org/merpad.git
cd merpad

# 2 · Install deps (grabs Mermaid & ELK)
npm ci

# 3 · Copy entry files + chunks into public/  (postinstall does this too)
npm run copy

# 4 · Run a tiny server (opens http://localhost:8000)
npm run dev
```

No Node? Use any static server (`python -m http.server`, `npx serve`, VS Code Live‑Server).

---

## 🖱️ Usage

| Action     | How                                                          |
| ---------- | ------------------------------------------------------------ |
| **Render** | Click **Render** or press **Ctrl + Enter**.                  |
| **Save**   | **Save** overwrites the opened file, or prompts if you haven’t saved yet. |
| **Open…**  | Choose a local `.mmd` / `.txt` file and Merpad re‑renders immediately. |
| **Export** | **SVG** & **PNG** buttons download; **Copy** puts PNG on your clipboard. |
| **Zoom**   | `＋` / `−` / **100 %**. Size label shows export dimensions.  |

Keyboard shortcuts are listed in the **?** menu in the viewer.

---

## 🛠️ Development scripts

```bash
npm run dev       # python http.server + open browser
npm run copy      # copy .mjs entries + chunks into public/
npm run build     # optional: rollup into single merpad.bundle.js
```

Viewer logic lives in `viewer.js`, styles in `viewer.css`.

---

## 📄 License

Free for personal, educational, and internal company use. Any resale, hosting, or distribution for profit is prohibited without written permission.

---

## ☕Buy me a coffee

Not required, but much appreciated! [Coffee me here](https://buymeacoffee.com/tommyenglish)

