/* ========= Themes ========= */
export const themes = {
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

/* ========= Theme backgrounds ========= */
export const themeBackgrounds = {
  default: '#ffffff',
  dark: '#1e1e1e',
  forest: '#f4f4f4',
  neutral: '#ffffff',
  vibrant: '#1a1a1a',
  print: '#ffffff'
};

/* ========= Constants ========= */
export const LS_TABS_KEY = 'merpad-tabs';
export const LS_ACTIVE_TAB_KEY = 'merpad-active-tab';
export const DEBOUNCE = 400;
export const ZOOM_FACTOR = 1.25;
export const MIN_SPLIT_SIZE = 100;
export const DEFAULT_SPLIT_VERTICAL = '200px';
export const DEFAULT_SPLIT_HORIZONTAL = '30%';

/* ========= Safe localStorage helpers ========= */
export function storageGet(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('Storage is full. Some data may not be saved.');
    }
  }
}

export function storageGetJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ========= Mutable application state ========= */
export const state = {
  currentTheme: 'print',
  currentLayout: 'dagre',
  zoom: 1,
  orientation: 'horizontal',
  tabs: [],
  activeTabId: null,
  nextTabId: 1
};
