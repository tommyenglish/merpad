import mermaid from './mermaid.esm.min.mjs';
import elkLayouts from './mermaid-layout-elk.esm.min.mjs';
import { state, themes, themeBackgrounds } from './state.js';

mermaid.registerLayoutLoaders(elkLayouts);
window.mermaid = mermaid;

export function applyConfig() {
  const cfg = structuredClone(themes[state.currentTheme]);
  // Disable responsive SVG sizing so diagrams hold their size with scrollbars
  cfg.useMaxWidth = false;
  if (state.currentLayout === 'dagre') {
    cfg.layout = 'dagre';
    cfg.flowchart = { defaultRenderer: 'dagre-wrapper', useMaxWidth: false };
  } else {
    const algo = state.currentLayout.split('-')[1];
    cfg.layout = 'elk';
    cfg.elk = { algorithm: algo };
    cfg.flowchart = { defaultRenderer: 'elk', useMaxWidth: false };
  }
  mermaid.initialize(cfg);
}

export function getSvgNaturalSize(output) {
  const svg = output.querySelector('svg');
  if (!svg) return null;
  const { width, height } = svg.getBBox();
  return { width, height };
}

export function updateDims(output, dimW, dimH) {
  const size = getSvgNaturalSize(output);
  if (!size) { dimW.value = ''; dimH.value = ''; return; }
  dimW.value = Math.round(size.width * state.zoom);
  dimH.value = Math.round(size.height * state.zoom);
}

export function applyZoom(output, dimW, dimH) {
  const svg = output.querySelector('svg');
  if (svg) svg.style.transform = `scale(${state.zoom})`;
  updateDims(output, dimW, dimH);
}

export function updateDiagramBackground(output) {
  output.style.backgroundColor = themeBackgrounds[state.currentTheme] || '#ffffff';
}

export async function render(editor, output, dimW, dimH) {
  const code = editor.value.trim();
  if (!code) { output.innerHTML = '<em>Nothing to render.</em>'; updateDims(output, dimW, dimH); return; }
  try {
    const { svg, bindFunctions } = await mermaid.render('mmd-diagram', code);
    output.innerHTML = svg; bindFunctions?.(output); applyZoom(output, dimW, dimH);
  } catch (e) { output.innerHTML = `<pre style="color:red">${e.message}</pre>`; updateDims(output, dimW, dimH); }
}

export function getPngBlob(output, cb) {
  const svg = output.querySelector('svg');
  if (!svg) return alert('Nothing to export!');
  const clone = svg.cloneNode(true); clone.style.transform = '';
  const { width: w, height: h } = svg.getBBox();
  const sw = w * state.zoom, sh = h * state.zoom;
  clone.setAttribute('width', sw); clone.setAttribute('height', sh);
  const data = 'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = themeBackgrounds[state.currentTheme] || '#ffffff';
    ctx.fillRect(0, 0, sw, sh);
    ctx.drawImage(img, 0, 0, sw, sh);
    canvas.toBlob(cb, 'image/png');
  }; img.src = data;
}
