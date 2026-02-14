const DEFAULTS = { highlightColor: '#0066ff', selectionColor: '#00b450', includeSource: false };

const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings');
const highlightInput = document.getElementById('highlight-color');
const selectionInput = document.getElementById('selection-color');
const includeSourceInput = document.getElementById('include-source');

settingsToggle.addEventListener('click', () => {
  settingsPanel.hidden = !settingsPanel.hidden;
});

if (chrome.storage?.sync) {
  chrome.storage.sync.get(DEFAULTS, (values) => {
    highlightInput.value = values.highlightColor;
    selectionInput.value = values.selectionColor;
    includeSourceInput.checked = values.includeSource;
  });
}

highlightInput.addEventListener('input', () => {
  chrome.storage?.sync?.set({ highlightColor: highlightInput.value });
});

selectionInput.addEventListener('input', () => {
  chrome.storage?.sync?.set({ selectionColor: selectionInput.value });
});

const moreDetails = document.querySelector('.disclosure');
const moreSummary = document.getElementById('more-settings-summary');
moreDetails.addEventListener('toggle', () => {
  moreSummary.textContent = moreDetails.open ? 'Hide settings' : 'Show more settings';
});

includeSourceInput.addEventListener('change', () => {
  chrome.storage?.sync?.set({ includeSource: includeSourceInput.checked });
});

document.getElementById('pick').addEventListener('click', () => {
  const status = document.getElementById('status');
  chrome.runtime.sendMessage({ action: 'activate-picker-from-popup' }, (res) => {
    if (res?.error) {
      console.error('html-to-md:', res.error);
      status.textContent = res.error;
      document.getElementById('try-hint').hidden = false;
    } else {
      window.close();
    }
  });
});

const shortcutDisplay = document.getElementById('shortcut-display');
const shortcutLink = document.getElementById('shortcut-link');

const KEY_LABELS = {
  Period: '.',
  Comma: ',',
  Space: 'Space',
};

chrome.commands.getAll((commands) => {
  const picker = commands.find((c) => c.name === 'activate-picker');
  if (picker && picker.shortcut) {
    const keys = picker.shortcut.split('+');
    keys.forEach((key) => {
      const span = document.createElement('span');
      span.className = 'key';
      span.textContent = KEY_LABELS[key] || key;
      shortcutDisplay.appendChild(span);
    });
  } else {
    const span = document.createElement('span');
    span.className = 'not-set';
    span.textContent = 'No shortcut set';
    shortcutDisplay.appendChild(span);
    shortcutLink.textContent = 'Set shortcut';
  }
});

const isFirefox = typeof browser !== 'undefined';
const shortcutsUrl = isFirefox ? 'about:addons' : 'chrome://extensions/shortcuts';

shortcutLink.addEventListener('click', () => {
  chrome.tabs.create({ url: shortcutsUrl });
});
