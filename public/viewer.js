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
let undoStack = []; // Stack for undo functionality
let lastSavedContent = ''; // Track last saved content to avoid duplicates

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

/* ========= Undo helper ========= */
function saveToUndoStack() {
  const currentContent = editor.value.trim();
  // Only save if content has changed and is not empty
  if (currentContent && currentContent !== lastSavedContent) {
    undoStack.push(currentContent);
    lastSavedContent = currentContent;
    // Limit undo stack to 20 items
    if (undoStack.length > 20) {
      undoStack.shift();
    }
    // Enable undo button
    $('#btnUndo').disabled = false;
  }
}

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
let undoPending;
editor.addEventListener('input', e => {
  clearTimeout(pending);
  clearTimeout(undoPending);

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

  // Save to undo stack after 2 seconds of inactivity
  undoPending = setTimeout(() => {
    saveToUndoStack();
  }, 2000);
});

// Save to undo stack when editor loses focus
editor.addEventListener('blur', () => {
  saveToUndoStack();
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
  // Save current state before opening new file
  saveToUndoStack();
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

/* ========= Templates ========= */
const templates = {
  flowchart: `flowchart TD
    A[Arrive at Hogwarts] --> B{Sorting Hat Decision}
    B -- Brave --> C[Gryffindor]
    B -- Cunning --> D[Slytherin]
    B -- Wise --> E[Ravenclaw]
    B -- Loyal --> F[Hufflepuff]
    C --> G[Begin Classes]
    D --> G
    E --> G
    F --> G`,

  sequence: `sequenceDiagram
    participant Harry
    participant Hedwig
    participant Ron
    participant Hermione

    Harry->>Hedwig: Write letter to Ron
    activate Hedwig
    Hedwig->>Ron: Deliver letter
    activate Ron
    Ron-->>Hedwig: Write reply
    deactivate Ron
    Hedwig-->>Harry: Return with response
    deactivate Hedwig

    Harry->>Hedwig: Send to Hermione
    activate Hedwig
    Hedwig->>Hermione: Deliver letter
    activate Hermione
    Hermione-->>Hedwig: Detailed reply (3 pages)
    deactivate Hermione
    Hedwig-->>Harry: Exhausted return
    deactivate Hedwig`,

  gantt: `gantt
    title Hogwarts School Year
    dateFormat YYYY-MM-DD
    section First Term
    Welcome Feast           :a1, 2024-09-01, 7d
    Defense Against Dark Arts :a2, after a1, 60d
    Potions Class          :a3, after a1, 60d
    section Halloween
    Troll in Dungeon       :b1, 2024-10-31, 1d
    Saving Hermione        :b2, after b1, 1d
    section Quidditch
    First Match            :c1, 2024-11-15, 1d
    Training Sessions      :c2, 2024-10-01, 90d
    section Christmas
    Winter Break           :d1, 2024-12-20, 14d
    section Final Term
    Exams Preparation      :e1, 2025-05-01, 30d
    Final Exams            :e2, after e1, 7d`,

  class: `classDiagram
    class Wizard {
        +String name
        +String house
        +int magicLevel
        +castSpell()
        +brewPotion()
    }
    class Gryffindor {
        +String trait = "Brave"
        +summonPatronus()
        +defendAgainstDarkArts()
    }
    class Slytherin {
        +String trait = "Cunning"
        +speakParseltongue()
        +masterLegilimency()
    }
    class Ravenclaw {
        +String trait = "Wise"
        +solveRiddles()
        +advancedCharms()
    }
    Wizard <|-- Gryffindor
    Wizard <|-- Slytherin
    Wizard <|-- Ravenclaw

    class Wand {
        +String wood
        +String core
        +choosesWizard()
    }
    Wizard "1" --> "1" Wand : wields`,

  erDiagram: `erDiagram
    STUDENT ||--o{ ENROLLMENT : enrolls
    STUDENT {
        string id PK
        string name
        string house
        int year
        date birthdate
    }
    HOUSE ||--o{ STUDENT : belongs_to
    HOUSE {
        string name PK
        string founder
        string commonRoom
        int points
    }
    CLASS ||--o{ ENROLLMENT : has
    CLASS {
        string id PK
        string name
        string professor
        string classroom
    }
    ENROLLMENT {
        string studentId FK
        string classId FK
        string grade
        int attendance
    }
    HOUSE ||--o{ QUIDDITCH_TEAM : fields
    QUIDDITCH_TEAM {
        string houseId FK
        string captain
        int wins
    }`,

  state: `stateDiagram-v2
    [*] --> Human
    Human --> Bitten : Werewolf Attack
    Bitten --> Infected : Survive Bite
    Infected --> Transforming : Full Moon Rises
    Transforming --> Werewolf : Complete Transformation
    Werewolf --> Hunting : Night Falls
    Hunting --> Werewolf : Prowling
    Werewolf --> Reverting : Dawn Breaks
    Reverting --> Human : Morning Light
    Human --> Infected : Monthly Cycle
    Infected --> Cured : Drink Wolfsbane Potion
    Cured --> [*]`,

  pie: `pie title House Points Championship
    "Gryffindor" : 482
    "Slytherin" : 472
    "Ravenclaw" : 426
    "Hufflepuff" : 352`,

  gitGraph: `gitGraph
    commit id: "Selected as Champion"
    commit id: "Study dragons"
    branch dragon-task
    checkout dragon-task
    commit id: "Learn Accio spell"
    commit id: "Practice on Firebolt"
    commit id: "Get past Hungarian Horntail"
    checkout main
    merge dragon-task tag: "Golden-Egg"
    commit id: "Decode egg clue"
    branch lake-task
    checkout lake-task
    commit id: "Research gillyweed"
    commit id: "Test breathing underwater"
    commit id: "Save hostages from lake"
    checkout main
    merge lake-task tag: "Second-Place"
    commit id: "Prepare for maze"
    commit id: "Enter maze"
    commit id: "Grab Triwizard Cup"`,

  journey: `journey
    title Harry's First Year at Hogwarts
    section Arrival
      Board Hogwarts Express: 5: Harry, Ron, Hermione
      Cross the Lake: 4: Harry, First Years
      Sorting Ceremony: 3: Harry, Sorting Hat
    section Learning Magic
      First Potions Class: 2: Harry, Snape
      Flying Lessons: 5: Harry, Madam Hooch
      Defense Against Dark Arts: 4: Harry, Professor
    section Adventures
      Troll in Dungeon: 3: Harry, Ron, Hermione
      First Quidditch Match: 5: Harry, Team
      Forbidden Forest: 2: Harry, Detention
    section Final Challenge
      Through the Trapdoor: 3: Harry, Ron, Hermione
      Defeat Voldemort: 4: Harry
      House Cup Victory: 5: Harry, Gryffindor`
};

/* ========= Template selector ========= */
const templateBtn = $('#templateBtn');
const templateMenu = $('#templateMenu');

// Toggle template menu
templateBtn.onclick = (e) => {
  e.stopPropagation();
  templateMenu.classList.toggle('show');
};

// Close menu when clicking outside
document.addEventListener('click', () => {
  templateMenu.classList.remove('show');
});

// Prevent menu from closing when clicking inside it
templateMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Handle template selection
templateMenu.querySelectorAll('.template-item').forEach(item => {
  item.onclick = () => {
    const templateName = item.dataset.template;
    if (templates[templateName]) {
      // Save current diagram to undo stack before loading template
      saveToUndoStack();
      // Load template
      editor.value = templates[templateName];
      localStorage.setItem(LS_KEY, editor.value);
      render();
    }
    templateMenu.classList.remove('show');
  };
});

/* ========= Undo functionality ========= */
$('#btnUndo').onclick = () => {
  if (undoStack.length > 0) {
    editor.value = undoStack.pop();
    lastSavedContent = editor.value.trim(); // Update lastSaved to prevent re-saving same content
    localStorage.setItem(LS_KEY, editor.value);
    render();
    // Disable undo button if stack is empty
    if (undoStack.length === 0) {
      $('#btnUndo').disabled = true;
    }
  }
};

/* ========= Starter diagram ========= */

const saved = localStorage.getItem(LS_KEY);
if (saved !== null && saved.trim()) {
  editor.value = saved;
} else {
  // default
  editor.value = templates.flowchart;
}

updateDiagramBackground();
render();