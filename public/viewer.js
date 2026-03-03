import { state, DEBOUNCE, ZOOM_FACTOR, MIN_SPLIT_SIZE, DEFAULT_SPLIT_VERTICAL, DEFAULT_SPLIT_HORIZONTAL, storageGet, storageSet } from './state.js';
import { templates } from './templates.js';
import { applyConfig, render, applyZoom, getSvgNaturalSize, updateDims, updateDiagramBackground } from './render.js';
import { saveCurrentTab, saveTabs, loadTabs, renderTabs as renderTabsRaw, switchToTab as switchToTabRaw, createNewTab as createNewTabRaw, closeTab as closeTabRaw } from './tabs.js';
import { setupSaveButton, setupOpenButton, setupExportButtons } from './fileio.js';

/* ========= DOM refs ========= */
const $ = q => document.querySelector(q);
const editor = $('#editor'), output = $('#diagram');
const themeSel = $('#themeSelect'), layoutSel = $('#layoutSelect');
const dimW = $('#dimW'), dimH = $('#dimH');
const divider = $('#divider'), splitContainer = $('#splitContainer');
const editorWrapper = $('#editorWrapper');
const layoutToggle = $('#layoutToggle');
const tabList = $('#tabList');
const templatePicker = $('#templatePicker');
const lineNumbers = $('#lineNumbers');
const btnNewTab = $('#btnNewTab');

/* ========= Bound helpers ========= */
function doRender() { render(editor, output, dimW, dimH); }
function doApplyZoom() { applyZoom(output, dimW, dimH); }
function doUpdateLineNumbers() {
  const count = editor.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= count; i++) html += `<div>${i}</div>`;
  lineNumbersInner.innerHTML = html;
}
function doRenderTabs() { renderTabsRaw(tabList, btnNewTab); }
function doSwitchToTab(tabId, skipSave) {
  switchToTabRaw(tabId, {
    editor, output, dimW, dimH, templatePicker,
    updateLineNumbers: doUpdateLineNumbers,
    render: doRender,
    renderTabs: doRenderTabs,
    skipSave
  });
}
function doCreateNewTab(showPicker = true) {
  createNewTabRaw({
    editor, output, templatePicker,
    updateLineNumbers: doUpdateLineNumbers,
    saveTabs,
    renderTabs: doRenderTabs,
    showPicker
  });
}
function doCloseTab(tabId) {
  closeTabRaw(tabId, {
    switchToTab: doSwitchToTab,
    createNewTab: doCreateNewTab,
    renderTabs: doRenderTabs
  });
}

/* ========= Apply initial config ========= */
applyConfig();

/* ========= Line numbers ========= */
const lineNumbersInner = document.createElement('div');
lineNumbersInner.className = 'line-numbers-inner';
lineNumbers.appendChild(lineNumbersInner);

editor.addEventListener('scroll', () => {
  lineNumbersInner.style.transform = `translateY(${-editor.scrollTop}px)`;
});

/* ========= Resizable divider ========= */
const SPLIT_VERTICAL_KEY = 'merpad-split-vertical';
const SPLIT_HORIZONTAL_KEY = 'merpad-split-horizontal';
const ORIENTATION_KEY = 'merpad-orientation';
let isDragging = false;

const savedOrientation = storageGet(ORIENTATION_KEY);
if (savedOrientation && (savedOrientation === 'vertical' || savedOrientation === 'horizontal')) {
  state.orientation = savedOrientation;
}
splitContainer.classList.add(state.orientation);

function restoreSplitPosition() {
  const key = state.orientation === 'vertical' ? SPLIT_VERTICAL_KEY : SPLIT_HORIZONTAL_KEY;
  const savedSplit = storageGet(key);
  if (savedSplit) {
    editorWrapper.style.flexBasis = savedSplit + 'px';
  } else {
    editorWrapper.style.flexBasis = state.orientation === 'vertical' ? DEFAULT_SPLIT_VERTICAL : DEFAULT_SPLIT_HORIZONTAL;
  }
}
restoreSplitPosition();

layoutToggle.onclick = () => {
  splitContainer.classList.remove(state.orientation);
  state.orientation = state.orientation === 'vertical' ? 'horizontal' : 'vertical';
  splitContainer.classList.add(state.orientation);
  storageSet(ORIENTATION_KEY, state.orientation);
  restoreSplitPosition();
};

divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  e.preventDefault();
  document.body.style.userSelect = 'none';
  document.body.style.cursor = state.orientation === 'vertical' ? 'row-resize' : 'col-resize';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const containerRect = splitContainer.getBoundingClientRect();
  const minSize = MIN_SPLIT_SIZE;

  if (state.orientation === 'vertical') {
    const newEditorHeight = e.clientY - containerRect.top;
    const maxHeight = containerRect.height - minSize;
    if (newEditorHeight >= minSize && newEditorHeight <= maxHeight) {
      editorWrapper.style.flexBasis = newEditorHeight + 'px';
    }
  } else {
    const newEditorWidth = e.clientX - containerRect.left;
    const maxWidth = containerRect.width - minSize;
    if (newEditorWidth >= minSize && newEditorWidth <= maxWidth) {
      editorWrapper.style.flexBasis = newEditorWidth + 'px';
    }
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    const currentSize = parseInt(editorWrapper.style.flexBasis);
    if (!isNaN(currentSize)) {
      const key = state.orientation === 'vertical' ? SPLIT_VERTICAL_KEY : SPLIT_HORIZONTAL_KEY;
      storageSet(key, currentSize);
    }
  }
});

/* ========= Diagram panning ========= */
let isPanning = false, panStartX, panStartY, panScrollLeft, panScrollTop;
output.addEventListener('mousedown', e => {
  isPanning = true;
  panStartX = e.clientX; panStartY = e.clientY;
  panScrollLeft = output.scrollLeft; panScrollTop = output.scrollTop;
  output.style.cursor = 'grabbing';
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!isPanning) return;
  output.scrollLeft = panScrollLeft - (e.clientX - panStartX);
  output.scrollTop = panScrollTop - (e.clientY - panStartY);
});
document.addEventListener('mouseup', () => {
  if (isPanning) { isPanning = false; output.style.cursor = 'grab'; }
});

/* ========= Event wiring ========= */
$('#zoomIn').onclick = () => { state.zoom *= ZOOM_FACTOR; doApplyZoom(); };
$('#zoomOut').onclick = () => { state.zoom /= ZOOM_FACTOR; doApplyZoom(); };
$('#zoomReset').onclick = () => { state.zoom = 1; doApplyZoom(); };

dimW.addEventListener('change', () => {
  const size = getSvgNaturalSize(output);
  if (!size || !dimW.value) return;
  state.zoom = parseInt(dimW.value) / size.width;
  const svg = output.querySelector('svg');
  if (svg) svg.style.transform = `scale(${state.zoom})`;
  dimH.value = Math.round(size.height * state.zoom);
});
dimH.addEventListener('change', () => {
  const size = getSvgNaturalSize(output);
  if (!size || !dimH.value) return;
  state.zoom = parseInt(dimH.value) / size.height;
  const svg = output.querySelector('svg');
  if (svg) svg.style.transform = `scale(${state.zoom})`;
  dimW.value = Math.round(size.width * state.zoom);
});

let pending;
editor.addEventListener('input', e => {
  doUpdateLineNumbers();
  clearTimeout(pending);
  saveCurrentTab();

  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (tab && !tab.modified) {
    tab.modified = true;
    doRenderTabs();
  }

  pending = setTimeout(() => {
    const isWhitespaceOnly =
      (e.data && /^[ \t\n\r]$/.test(e.data)) ||
      (e.inputType === 'insertParagraph') ||
      (e.inputType === 'insertLineBreak');

    if (!isWhitespaceOnly) {
      doRender();
    }
  }, DEBOUNCE);
});

themeSel.value = state.currentTheme;
layoutSel.value = state.currentLayout;
themeSel.onchange = () => { state.currentTheme = themeSel.value; applyConfig(); updateDiagramBackground(output); doRender(); };
layoutSel.onchange = () => { state.currentLayout = layoutSel.value; applyConfig(); doRender(); };

/* ========= File I/O wiring ========= */
setupSaveButton($('#btnSave'), {
  editor, output,
  saveTabs,
  renderTabs: doRenderTabs
});

setupOpenButton($('#btnOpen'), $('#fileOpen'), {
  editor, output, templatePicker,
  updateLineNumbers: doUpdateLineNumbers,
  saveCurrentTab,
  renderTabs: doRenderTabs,
  render: doRender,
  createNewTab: (showPicker) => doCreateNewTab(showPicker)
});

setupExportButtons($('#btnSvg'), $('#btnPng'), $('#btnCopy'), output);

/* ========= Tab event listeners ========= */
btnNewTab.onclick = () => doCreateNewTab(true);

tabList.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab-close')) {
    const tabId = parseInt(e.target.dataset.tabId);
    doCloseTab(tabId);
    e.stopPropagation();
  }
});

tabList.addEventListener('tab-switch', (e) => {
  doSwitchToTab(e.detail.tabId);
});

/* ========= Tab keyboard navigation ========= */
tabList.addEventListener('keydown', (e) => {
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const currentIndex = tabs.indexOf(e.target);
  if (currentIndex === -1) return;

  let nextIndex;
  switch (e.key) {
    case 'ArrowRight':
      nextIndex = (currentIndex + 1) % tabs.length;
      break;
    case 'ArrowLeft':
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      doSwitchToTab(parseInt(e.target.dataset.tabId));
      return;
    case 'Delete':
    case 'Backspace':
      e.preventDefault();
      doCloseTab(parseInt(e.target.dataset.tabId));
      return;
    default:
      return;
  }

  e.preventDefault();
  tabs[nextIndex].focus();
});

/* ========= Template picker ========= */
function selectTemplate(card) {
  const templateName = card.dataset.template;
  if (templates[templateName]) {
    editor.value = templates[templateName];
    doUpdateLineNumbers();
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (tab) { tab.modified = true; }
    saveCurrentTab();
    templatePicker.classList.add('hidden');
    doRenderTabs();
    doRender();
    editor.focus();
  }
}

templatePicker.querySelectorAll('.template-card').forEach(card => {
  card.onclick = () => selectTemplate(card);
});

$('#btnSkipTemplate').onclick = () => {
  templatePicker.classList.add('hidden');
  editor.focus();
};

/* ========= Template picker keyboard navigation ========= */
templatePicker.addEventListener('keydown', (e) => {
  const cards = [...templatePicker.querySelectorAll('.template-card')];
  const currentIndex = cards.indexOf(e.target);
  if (currentIndex === -1) return;

  let nextIndex;
  switch (e.key) {
    case 'ArrowRight':
      nextIndex = Math.min(currentIndex + 1, cards.length - 1);
      break;
    case 'ArrowLeft':
      nextIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'ArrowDown':
      nextIndex = Math.min(currentIndex + 3, cards.length - 1);
      break;
    case 'ArrowUp':
      nextIndex = Math.max(currentIndex - 3, 0);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      selectTemplate(e.target);
      return;
    case 'Escape':
      e.preventDefault();
      templatePicker.classList.add('hidden');
      editor.focus();
      return;
    default:
      return;
  }

  e.preventDefault();
  cards[nextIndex].focus();
});

/* ========= Initialize ========= */
updateDiagramBackground(output);
loadTabs({
  editor, output, tabList, templatePicker,
  updateLineNumbers: doUpdateLineNumbers,
  render: doRender,
  renderTabs: doRenderTabs,
  switchToTab: doSwitchToTab,
  createNewTab: doCreateNewTab
});
doUpdateLineNumbers();

window.addEventListener('beforeunload', () => { saveCurrentTab(); });
