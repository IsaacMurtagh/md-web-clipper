function getTabError(tab) {
  const url = tab.url || '';
  if (!url || url === 'about:blank') {
    return 'Navigate to a webpage first.';
  }
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    return 'Extensions cannot run on browser pages. Try a regular webpage.';
  }
  if (url.startsWith('https://chrome.google.com/webstore') || url.startsWith('https://addons.mozilla.org')) {
    return 'Extensions cannot run on the web store. Try a regular webpage.';
  }
  if (url.startsWith('chrome://extensions')) {
    return 'Extensions cannot run on this page. Try a regular webpage.';
  }
  return null;
}

async function activatePicker(tab) {
  const error = getTabError(tab);
  if (error) throw new Error(error);

  // Try sending message first (scripts already injected)
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'activate-picker' });
    return;
  } catch {}

  // Inject scripts then activate
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/turndown.js', 'lib/turndown-plugin-gfm.js', 'lib/marked.min.js', 'src/converter.js', 'src/content.js'],
    });
  } catch {
    throw new Error('Cannot access this page. Try refreshing it first.');
  }
  await chrome.tabs.sendMessage(tab.id, { action: 'activate-picker' });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'activate-picker') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    await activatePicker(tab);
  } catch (e) {
    console.warn('Could not activate picker:', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'activate-picker-from-popup') return;

  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (!tab?.id) {
      sendResponse({ error: 'No active tab found.' });
      return;
    }
    activatePicker(tab)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ error: e.message }));
  });

  return true; // keep channel open for async response
});
