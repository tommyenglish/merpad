/* ========= Import and register things */
import mermaid from './mermaid.esm.min.mjs';
import elkLoader from './mermaid-layout-elk.esm.min.mjs';  

mermaid.registerLayoutLoaders([elkLoader]);

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
let currentTheme='print';
let currentLayout='dagre';
let zoom=1;

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
$('#render').onclick=render;
$('#zoomIn').onclick =()=>{zoom*=1.25;applyZoom();};
$('#zoomOut').onclick=()=>{zoom/=1.25;applyZoom();};
$('#zoomReset').onclick=()=>{zoom=1;applyZoom();};

let saveTimeout;
editor.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(LS_KEY, editor.value);
  }, 400);
});

themeSel.value=currentTheme;
layoutSel.value=currentLayout;
themeSel.onchange=()=>{currentTheme=themeSel.value;applyConfig();render();};
layoutSel.onchange=()=>{currentLayout=layoutSel.value;applyConfig();render();};

/* ----- Save .mmd ----- */
$('#btnSave').onclick=()=>{
  const text=editor.value;if(!text.trim())return;
  const blob=new Blob([text],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:'diagram.mmd'});
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
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
    canvas.getContext('2d').drawImage(img,0,0,sw,sh);
    canvas.toBlob(cb,'image/png');
  };img.src=data;
}
const download=(blob,name)=>{
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:name});
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
};
$('#btnSvg').onclick=()=>{
  const svg=$('svg',output);if(!svg)return alert('Nothing to export!');
  download(new Blob([new XMLSerializer().serializeToString(svg)],
    {type:'image/svg+xml'}),'diagram.svg');
};
$('#btnPng').onclick=()=>getPngBlob(b=>download(b,'diagram.png'));
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

render();