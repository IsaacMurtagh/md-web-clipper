chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'activate-picker') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'activate-picker' });
  } catch (e) {
    console.warn('Could not send message to tab:', e);
  }
});
