import { state, LS_TABS_KEY, LS_ACTIVE_TAB_KEY } from './state.js';

export function saveCurrentTab() {
  if (state.activeTabId !== null) {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (tab) {
      tab.content = document.querySelector('#editor').value;
      saveTabs();
    }
  }
}

export function saveTabs() {
  localStorage.setItem(LS_TABS_KEY, JSON.stringify(state.tabs));
  localStorage.setItem(LS_ACTIVE_TAB_KEY, state.activeTabId);
}

export function loadTabs({ editor, output, tabList, templatePicker, updateLineNumbers, render, renderTabs, switchToTab, createNewTab }) {
  const savedTabs = localStorage.getItem(LS_TABS_KEY);
  const savedActiveId = localStorage.getItem(LS_ACTIVE_TAB_KEY);

  if (savedTabs) {
    state.tabs = JSON.parse(savedTabs);
    state.tabs.forEach(tab => {
      if (tab.modified === undefined) tab.modified = false;
    });
    state.nextTabId = Math.max(...state.tabs.map(t => t.id), 0) + 1;
    state.activeTabId = savedActiveId ? parseInt(savedActiveId) : (state.tabs[0]?.id || null);
  }

  if (state.tabs.length === 0) {
    createNewTab();
  } else {
    renderTabs();
    switchToTab(state.activeTabId, true);
  }
}

export function renderTabs(tabList, btnNewTab) {
  tabList.innerHTML = '';

  state.tabs.forEach(tab => {
    const isActive = tab.id === state.activeTabId;
    const tabEl = document.createElement('div');
    tabEl.className = 'tab' + (isActive ? ' active' : '');
    tabEl.setAttribute('role', 'tab');
    tabEl.setAttribute('aria-selected', String(isActive));
    tabEl.setAttribute('tabindex', isActive ? '0' : '-1');
    tabEl.dataset.tabId = tab.id;
    const modifiedIndicator = tab.modified ? ' *' : '';
    tabEl.innerHTML = `
      <span class="tab-name">${tab.name}${modifiedIndicator}</span>
      <span class="tab-close" data-tab-id="${tab.id}" aria-label="Close ${tab.name}" role="button" tabindex="-1">\u00d7</span>
    `;
    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        tabEl.dispatchEvent(new CustomEvent('tab-switch', { bubbles: true, detail: { tabId: tab.id } }));
      }
    });
    tabList.appendChild(tabEl);
  });

  tabList.appendChild(btnNewTab);
}

export function switchToTab(tabId, { editor, output, dimW, dimH, templatePicker, updateLineNumbers, render: renderFn, renderTabs: renderTabsFn, skipSave } = {}) {
  if (!skipSave) saveCurrentTab();
  state.activeTabId = tabId;
  const tab = state.tabs.find(t => t.id === tabId);
  if (tab) {
    editor.value = tab.content;
    updateLineNumbers();
    renderTabsFn();
    renderFn();

    if (tab.content.trim()) {
      templatePicker.classList.add('hidden');
    }
  }
}

function getNextUntitledNumber() {
  const untitledNumbers = state.tabs
    .map(tab => {
      const match = tab.name.match(/^Untitled (\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => num > 0);

  return untitledNumbers.length > 0 ? Math.max(...untitledNumbers) + 1 : 1;
}

export function createNewTab({ editor, output, templatePicker, updateLineNumbers, saveTabs: saveTabsFn, renderTabs: renderTabsFn, showPicker = true } = {}) {
  saveCurrentTab();
  const newTab = {
    id: state.nextTabId++,
    name: `Untitled ${getNextUntitledNumber()}`,
    content: '',
    modified: false
  };
  state.tabs.push(newTab);
  state.activeTabId = newTab.id;
  editor.value = '';
  updateLineNumbers();
  saveTabs();
  renderTabsFn();

  if (showPicker) {
    templatePicker.classList.remove('hidden');
  } else {
    templatePicker.classList.add('hidden');
  }

  output.innerHTML = '<em>Nothing to render.</em>';
  editor.focus();
}

export function closeTab(tabId, { switchToTab: switchFn, createNewTab: createFn, renderTabs: renderTabsFn }) {
  const index = state.tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  state.tabs.splice(index, 1);

  if (state.tabs.length === 0) {
    createFn();
  } else if (tabId === state.activeTabId) {
    const newIndex = Math.min(index, state.tabs.length - 1);
    switchFn(state.tabs[newIndex].id);
  } else {
    saveTabs();
    renderTabsFn();
  }
}
