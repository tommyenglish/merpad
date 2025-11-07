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

/* ========= Error Handling Helpers ========= */

// Parse error message to extract line and column information
function parseErrorLocation(errorMessage) {
  // Try different patterns that Mermaid might use
  const patterns = [
    /line (\d+)/i,
    /at line (\d+)/i,
    /on line (\d+)/i,
    /\((\d+):/,  // (line:col) format
    /Parse error on line (\d+)/i
  ];

  let line = null;
  let column = null;

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      line = parseInt(match[1], 10);
      break;
    }
  }

  // Try to find column number
  const colPatterns = [
    /column (\d+)/i,
    /col (\d+)/i,
    /:(\d+):/,  // :line:col: format
    /\((\d+):(\d+)\)/  // (line:col) format
  ];

  for (const pattern of colPatterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      column = parseInt(match[match.length - 1], 10);
      break;
    }
  }

  return { line, column };
}

// Provide helpful, user-friendly error suggestions
function getHelpfulMessage(errorMessage) {
  const msg = errorMessage.toLowerCase();

  // Common Mermaid syntax errors and helpful guidance
  const errorGuides = [
    {
      pattern: /expecting|expected/,
      message: "Check that all diagram elements have the correct syntax. Make sure arrows, brackets, and keywords are properly formatted.",
      example: "Example: Use --> for arrows, [] for rectangles, {} for decisions"
    },
    {
      pattern: /unexpected/,
      message: "There's an unexpected character or keyword. Review the line for typos or incorrect syntax.",
      example: "Tip: Make sure quotes match and special characters are used correctly"
    },
    {
      pattern: /parse error|syntax error/,
      message: "The diagram syntax doesn't match what Mermaid expects. Double-check your diagram type and structure.",
      example: "Example: Start with 'flowchart TD' or 'sequenceDiagram' or other valid diagram types"
    },
    {
      pattern: /lexical error/,
      message: "There's an invalid character or incomplete statement. Look for unfinished quotes, brackets, or special characters.",
      example: "Tip: Check that all opening brackets have closing brackets"
    },
    {
      pattern: /unknown.*type|invalid.*type/,
      message: "The diagram type might be misspelled or not supported.",
      example: "Common types: flowchart, sequenceDiagram, classDiagram, gantt, pie, gitGraph"
    },
    {
      pattern: /undefined/,
      message: "You're referencing something that hasn't been defined yet. Make sure all node IDs are created before being used.",
      example: "Tip: Define nodes before connecting them with arrows"
    },
    {
      pattern: /bracket|brace|parenthes/,
      message: "There's a mismatch with brackets, braces, or parentheses. Make sure they're properly opened and closed.",
      example: "Tip: Count your opening [ ( { and closing } ) ] to make sure they match"
    }
  ];

  for (const guide of errorGuides) {
    if (guide.pattern.test(msg)) {
      return guide;
    }
  }

  // Default helpful message
  return {
    message: "There's a problem with the diagram syntax. Review the highlighted area and check the Mermaid documentation.",
    example: "Tip: Start simple and build up - test each part as you add it"
  };
}

// Highlight error line in the editor
function highlightErrorLine(lineNumber) {
  // Clear any existing highlights
  clearErrorHighlight();

  if (!lineNumber) return;

  const lines = editor.value.split('\n');
  if (lineNumber < 1 || lineNumber > lines.length) return;

  // Calculate the character position of the error line
  let charPosition = 0;
  for (let i = 0; i < lineNumber - 1; i++) {
    charPosition += lines[i].length + 1; // +1 for newline
  }

  // Scroll to the line
  editor.focus();
  editor.setSelectionRange(charPosition, charPosition + lines[lineNumber - 1].length);
  editor.scrollTop = Math.max(0, (lineNumber - 3) * 20); // Approximate line height

  // Store error line for visual indication (if we want to add background color later)
  editor.dataset.errorLine = lineNumber;
}

// Clear error highlighting
function clearErrorHighlight() {
  delete editor.dataset.errorLine;
  // Remove selection
  editor.setSelectionRange(0, 0);
}

// Generate error panel HTML
function createErrorPanel(error) {
  const { line, column } = parseErrorLocation(error.message);
  const helpGuide = getHelpfulMessage(error.message);

  let locationHTML = '';
  if (line) {
    locationHTML = `<div class="error-location">
      Line ${line}${column ? `, Column ${column}` : ''}
    </div>`;
  }

  const errorHTML = `
    <div class="error-panel">
      <div class="error-header">
        <span class="error-icon">⚠️</span>
        <span>Diagram Error</span>
      </div>
      ${locationHTML}
      <div class="error-message">${error.message}</div>
      <div class="error-help">
        <strong>💡 How to fix this:</strong>
        ${helpGuide.message}
        ${helpGuide.example ? `<br><br><em>${helpGuide.example}</em>` : ''}
      </div>
      <div class="error-actions">
        ${line ? `<button class="error-button error-button-primary" onclick="highlightErrorLine(${line})">Go to Line ${line}</button>` : ''}
        <a href="https://mermaid.js.org/intro/syntax-reference.html" target="_blank" class="error-button error-button-secondary">View Mermaid Syntax Guide</a>
      </div>
    </div>
  `;

  return errorHTML;
}

// Make highlightErrorLine available globally for button onclick
window.highlightErrorLine = highlightErrorLine;

/* ========= Render ========= */
async function render(){
  const code=editor.value.trim();
  if(!code){
    output.innerHTML='<em>Nothing to render.</em>';
    clearErrorHighlight();
    updateDims();
    return;
  }
  try{
    const {svg,bindFunctions}=await mermaid.render('mmd-diagram',code);
    output.innerHTML=svg;
    bindFunctions?.(output);
    clearErrorHighlight(); // Clear any previous error highlights on success
    applyZoom();
  }catch(e){
    output.innerHTML=createErrorPanel(e);

    // Auto-highlight the error line if available
    const { line } = parseErrorLocation(e.message);
    if (line) {
      highlightErrorLine(line);
    }

    updateDims();
  }
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