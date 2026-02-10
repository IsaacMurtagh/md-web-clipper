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
