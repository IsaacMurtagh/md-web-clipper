async function activatePicker(tabId) {
  // Try sending message first (scripts already injected)
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'activate-picker' });
    return;
  } catch {}

  // Inject scripts then activate
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['lib/turndown.js', 'lib/turndown-plugin-gfm.js', 'src/content.js'],
  });
  await chrome.tabs.sendMessage(tabId, { action: 'activate-picker' });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'activate-picker') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    await activatePicker(tab.id);
  } catch (e) {
    console.warn('Could not activate picker:', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'activate-picker-from-popup') return;

  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (!tab?.id) {
      sendResponse({ error: 'No active tab' });
      return;
    }
    activatePicker(tab.id)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ error: e.message }));
  });

  return true; // keep channel open for async response
});
