(() => {
  let pickerActive = false;
  let overlay = null;

  function createOverlay() {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;' +
      'background:rgba(0,102,255,0.15);border:2px solid rgba(0,102,255,0.6);' +
      'transition:all 0.05s ease;border-radius:3px;';
    document.documentElement.appendChild(el);
    return el;
  }

  function positionOverlay(el) {
    const rect = el.getBoundingClientRect();
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function onMouseMove(e) {
    if (!pickerActive) return;
    positionOverlay(e.target);
  }

  function onClick(e) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = e.target;
    deactivate();
    convert(target);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      deactivate();
    }
  }

  function activate() {
    if (pickerActive) return;
    pickerActive = true;
    overlay = createOverlay();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function deactivate() {
    pickerActive = false;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function convert(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('script, style, noscript').forEach((el) => el.remove());

    const td = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    const body = td.turndown(clone);
    const source = `[${document.title}](${location.href})`;
    const markdown = source + '\n\n' + body;
    copyToClipboard(markdown);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast('Markdown copied!');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:2147483647;' +
      'background:#333;color:#fff;padding:10px 18px;border-radius:8px;' +
      'font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.2s;';
    document.documentElement.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = '1'));
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'activate-picker') {
      activate();
    }
  });
})();
