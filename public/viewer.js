/* ========= Import and register things */
import mermaid from './mermaid.esm.min.mjs';
import elkLayouts from './mermaid-layout-elk.esm.min.mjs'; 

mermaid.registerLayoutLoaders(elkLayouts);

window.mermaid = mermaid;

/* ========= Themes ========= */
const themes = {
  default:{theme:'default'},
  dark:{theme:'dark'},
  forest:{theme:'forest'},
  neutral:{theme:'neutral'},
  vibrant:{
    theme:'base',
    themeVariables:{
      primaryColor:'#ff0066',primaryTextColor:'#fff',
      lineColor:'#ff0066',secondaryColor:'#ffeeea',
      tertiaryColor:'#ffe0e8',nodeTextColor:'#222'}},
  print:{
    theme:'base',
    themeVariables:{background:'#fff',primaryColor:'#fff',
      primaryTextColor:'#000',lineColor:'#000',nodeTextColor:'#000'}}
};

/* ========= State ========= */
const LS_KEY = 'merpad-current-diagram';
const DEBOUNCE = 400; // ms to wait after last keystroke
let currentTheme='print';
let currentLayout='dagre';
let zoom=1;
let orientation='horizontal'; // 'vertical' or 'horizontal'

/* ========= Theme backgrounds ========= */
// Define background colors for each theme
const themeBackgrounds = {
  default: '#ffffff',
  dark: '#1e1e1e',
  forest: '#f4f4f4',
  neutral: '#ffffff',
  vibrant: '#1a1a1a',
  print: '#ffffff'
};

/* ========= Apply mermaid config ========= */
function applyConfig(){
  const cfg=structuredClone(themes[currentTheme]);
  if(currentLayout==='dagre'){
    cfg.layout='dagre';
    cfg.flowchart={defaultRenderer:'dagre-wrapper'};
  }else{
    const algo=currentLayout.split('-')[1];           // layered | mrtree | radial
    cfg.layout='elk';
    cfg.elk={algorithm:algo};
    cfg.flowchart={defaultRenderer:'elk'};
  }
  mermaid.initialize(cfg);
}
applyConfig();

/* ========= DOM refs ========= */
const $=q=>document.querySelector(q);
const editor=$('#editor'),output=$('#diagram');
const themeSel=$('#themeSelect'),layoutSel=$('#layoutSelect'),dims=$('#dims');
const divider=$('#divider'),splitContainer=$('#splitContainer');
const layoutToggle=$('#layoutToggle');

/* ========= Helpers ========= */
function updateDims(){
  const svg=$('svg',output);
  if(!svg){dims.textContent='';return;}
  const {width,height}=svg.getBBox();
  dims.textContent=`${Math.round(width*zoom)}×${Math.round(height*zoom)} px`;
}
function applyZoom(){
  const svg=$('svg',output);
  if(svg) svg.style.transform=`scale(${zoom})`;
  updateDims();
}
function updateDiagramBackground(){
  output.style.backgroundColor=themeBackgrounds[currentTheme]||'#ffffff';
}

/* ========= Resizable divider ========= */
const SPLIT_VERTICAL_KEY = 'merpad-split-vertical';
const SPLIT_HORIZONTAL_KEY = 'merpad-split-horizontal';
const ORIENTATION_KEY = 'merpad-orientation';
let isDragging = false;

// Restore saved orientation
const savedOrientation = localStorage.getItem(ORIENTATION_KEY);
if (savedOrientation && (savedOrientation === 'vertical' || savedOrientation === 'horizontal')) {
  orientation = savedOrientation;
}
splitContainer.classList.add(orientation);

// Restore saved split position
function restoreSplitPosition() {
  const key = orientation === 'vertical' ? SPLIT_VERTICAL_KEY : SPLIT_HORIZONTAL_KEY;
  const savedSplit = localStorage.getItem(key);
  if (savedSplit) {
    editor.style.flexBasis = savedSplit + 'px';
  } else {
    // Reset to default
    editor.style.flexBasis = orientation === 'vertical' ? '200px' : '30%';
  }
}
restoreSplitPosition();

// Toggle layout orientation
layoutToggle.onclick = () => {
  // Remove current class and toggle orientation
  splitContainer.classList.remove(orientation);
  orientation = orientation === 'vertical' ? 'horizontal' : 'vertical';
  splitContainer.classList.add(orientation);

  // Save orientation preference
  localStorage.setItem(ORIENTATION_KEY, orientation);

  // Restore split position for new orientation
  restoreSplitPosition();
};

divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  e.preventDefault();
  document.body.style.userSelect = 'none';
  document.body.style.cursor = orientation === 'vertical' ? 'row-resize' : 'col-resize';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const containerRect = splitContainer.getBoundingClientRect();
  const minSize = 100;

  if (orientation === 'vertical') {
    const newEditorHeight = e.clientY - containerRect.top;
    const maxHeight = containerRect.height - minSize;

    if (newEditorHeight >= minSize && newEditorHeight <= maxHeight) {
      editor.style.flexBasis = newEditorHeight + 'px';
    }
  } else {
    const newEditorWidth = e.clientX - containerRect.left;
    const maxWidth = containerRect.width - minSize;

    if (newEditorWidth >= minSize && newEditorWidth <= maxWidth) {
      editor.style.flexBasis = newEditorWidth + 'px';
    }
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Save the current split position for current orientation
    const currentSize = parseInt(editor.style.flexBasis);
    if (!isNaN(currentSize)) {
      const key = orientation === 'vertical' ? SPLIT_VERTICAL_KEY : SPLIT_HORIZONTAL_KEY;
      localStorage.setItem(key, currentSize);
    }
  }
});

/* ========= Render ========= */
async function render(){
  const code=editor.value.trim();
  if(!code){output.innerHTML='<em>Nothing to render.</em>';updateDims();return;}
  try{
    const {svg,bindFunctions}=await mermaid.render('mmd-diagram',code);
    output.innerHTML=svg;bindFunctions?.(output);applyZoom();
  }catch(e){output.innerHTML=`<pre style="color:red">${e.message}</pre>`;updateDims();}
}

/* ========= Event wiring ========= */
$('#zoomIn').onclick =()=>{zoom*=1.25;applyZoom();};
$('#zoomOut').onclick=()=>{zoom/=1.25;applyZoom();};
$('#zoomReset').onclick=()=>{zoom=1;applyZoom();};

let pending;
editor.addEventListener('input', e => {
  clearTimeout(pending);
  pending = setTimeout(() => {
    const isWhitespaceOnly =
      (e.data && /^[ \t\n\r]$/.test(e.data)) ||  // normal typing
      (e.inputType === 'insertParagraph') ||     // Enter on some browsers
      (e.inputType === 'insertLineBreak');       // Shift+Enter
	
    if (!isWhitespaceOnly) {
      render();                                    // auto‑render
      localStorage.setItem(LS_KEY, editor.value);  // auto‑save
	}
  }, DEBOUNCE);
});

themeSel.value=currentTheme;
layoutSel.value=currentLayout;
themeSel.onchange=()=>{currentTheme=themeSel.value;applyConfig();updateDiagramBackground();render();};
layoutSel.onchange=()=>{currentLayout=layoutSel.value;applyConfig();render();};

/* ----- Save .mmd ----- */
$('#btnSave').onclick=async ()=>{
  const text=editor.value;if(!text.trim())return;
  const blob=new Blob([text],{type:'text/plain'});

  // Try to use File System Access API for save dialog
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'diagram.mmd',
        types: [{
          description: 'Mermaid Diagram',
          accept: {'text/plain': ['.mmd', '.txt']}
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
        alert('Save failed: ' + err.message);
      }
    }
  } else {
    // Fallback to instant download for unsupported browsers
    download(blob, 'diagram.mmd');
  }
};
/* ----- Open .mmd ----- */
const fileInput=$('#fileOpen');
$('#btnOpen').onclick=()=>fileInput.click();
fileInput.onchange=()=>{
  const file=fileInput.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=e=>{editor.value=e.target.result;render();};
  r.readAsText(file,'utf-8');
};

/* ----- PNG / SVG / Copy helpers ----- */
function getPngBlob(cb){
  const svg=$('svg',output);if(!svg)return alert('Nothing to export!');
  const clone=svg.cloneNode(true);clone.style.transform='';
  const {width:w,height:h}=svg.getBBox();const sw=w*zoom,sh=h*zoom;
  clone.setAttribute('width',sw);clone.setAttribute('height',sh);
  const data='data:image/svg+xml;charset=utf-8,'+
    encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img=new Image();img.crossOrigin='anonymous';
  img.onload=()=>{
    const canvas=Object.assign(document.createElement('canvas'),{width:sw,height:sh});
    const ctx=canvas.getContext('2d');
    // Fill background with theme-appropriate color
    ctx.fillStyle=themeBackgrounds[currentTheme]||'#ffffff';
    ctx.fillRect(0,0,sw,sh);
    ctx.drawImage(img,0,0,sw,sh);
    canvas.toBlob(cb,'image/png');
  };img.src=data;
}
const download=(blob,name)=>{
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:name});
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
};
$('#btnSvg').onclick=async ()=>{
  const svg=$('svg',output);if(!svg)return alert('Nothing to export!');
  const svgString = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgString], {type:'image/svg+xml'});

  // Try to use File System Access API for save dialog
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'diagram.svg',
        types: [{
          description: 'SVG Image',
          accept: {'image/svg+xml': ['.svg']}
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
        alert('Save failed: ' + err.message);
      }
    }
  } else {
    // Fallback to instant download for unsupported browsers
    download(blob, 'diagram.svg');
  }
};
$('#btnPng').onclick=async ()=>{
  getPngBlob(async (blob) => {
    // Try to use File System Access API for save dialog
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'diagram.png',
          types: [{
            description: 'PNG Image',
            accept: {'image/png': ['.png']}
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.error('Save failed:', err);
          alert('Save failed: ' + err.message);
        }
      }
    } else {
      // Fallback to instant download for unsupported browsers
      download(blob, 'diagram.png');
    }
  });
};
$('#btnCopy').onclick=()=>{
  if(!navigator.clipboard||!window.ClipboardItem){alert('Clipboard API unsupported');return;}
  getPngBlob(b=>navigator.clipboard
    .write([new ClipboardItem({'image/png':b})])
    .catch(e=>alert('Failed: '+e)));
};

/* ========= Starter diagram ========= */

const saved = localStorage.getItem(LS_KEY);
if (saved !== null && saved.trim()) {
  editor.value = saved;
} else {
  // default
  editor.value = `flowchart TD
  A[Start] --> B{Is it sunny?}
  B -- Yes --> C[Go for a walk]
  B -- No  --> D[Read a book]
  C --> E[End]
  D --> E`;
}

updateDiagramBackground();
render();