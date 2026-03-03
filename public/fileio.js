import { state, themeBackgrounds } from './state.js';
import { getPngBlob } from './render.js';

export const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};

export function setupSaveButton(btnSave, { editor, output, saveTabs, renderTabs }) {
  btnSave.onclick = async () => {
    const text = editor.value; if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/plain' });

    const tab = state.tabs.find(t => t.id === state.activeTabId);
    const suggestedName = (tab && tab.name !== `Untitled ${tab.id}` ? tab.name : 'diagram') + '.mmd';

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: 'Mermaid Diagram', accept: { 'text/plain': ['.mmd', '.txt'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        if (tab && handle.name) {
          tab.name = handle.name.replace(/\.mmd$/, '');
          tab.modified = false;
          saveTabs();
          renderTabs();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Save failed:', err);
          alert('Save failed: ' + err.message);
        }
      }
    } else {
      download(blob, suggestedName);
    }
  };
}

export function setupOpenButton(btnOpen, fileInput, { editor, output, templatePicker, updateLineNumbers, saveCurrentTab, renderTabs, render, createNewTab }) {
  btnOpen.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const file = fileInput.files[0]; if (!file) return;

    if (editor.value.trim()) {
      createNewTab(false);
    }

    const r = new FileReader();
    r.onload = e => {
      editor.value = e.target.result;
      updateLineNumbers();
      templatePicker.classList.add('hidden');
      const tab = state.tabs.find(t => t.id === state.activeTabId);
      if (tab) {
        tab.name = file.name.replace(/\.mmd$/, '');
        tab.content = e.target.result;
        tab.modified = false;
      }
      saveCurrentTab();
      renderTabs();
      render();
    };
    r.readAsText(file, 'utf-8');
  };
}

export function setupExportButtons(btnSvg, btnPng, btnCopy, output) {
  btnSvg.onclick = async () => {
    const svg = output.querySelector('svg');
    if (!svg) return alert('Nothing to export!');
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'diagram.svg',
          types: [{ description: 'SVG Image', accept: { 'image/svg+xml': ['.svg'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Save failed:', err);
          alert('Save failed: ' + err.message);
        }
      }
    } else {
      download(blob, 'diagram.svg');
    }
  };

  btnPng.onclick = async () => {
    getPngBlob(output, async (blob) => {
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: 'diagram.png',
            types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
            alert('Save failed: ' + err.message);
          }
        }
      } else {
        download(blob, 'diagram.png');
      }
    });
  };

  btnCopy.onclick = () => {
    if (!navigator.clipboard || !window.ClipboardItem) { alert('Clipboard API unsupported'); return; }
    getPngBlob(output, b => navigator.clipboard
      .write([new ClipboardItem({ 'image/png': b })])
      .catch(e => alert('Failed: ' + e)));
  };
}
