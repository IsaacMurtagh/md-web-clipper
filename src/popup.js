document.getElementById('pick').addEventListener('click', async () => {
  const status = document.getElementById('status');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'activate-picker' });
    window.close();
  } catch (err) {
    console.error('html-to-md:', err);
    status.textContent = 'Could not reach this page. Try refreshing first.';
  }
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

shortcutLink.addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
