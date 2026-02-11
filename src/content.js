(() => {
  let pickerActive = false;
  let overlay = null;
  let parentOverlay = null;
  let shiftHeld = false;
  let selectedElements = [];
  let selectedOverlays = [];

  function createOverlay() {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;' +
      'background:rgba(0,102,255,0.15);border:2px solid rgba(0,102,255,0.6);' +
      'transition:all 0.05s ease;border-radius:3px;';
    document.documentElement.appendChild(el);
    return el;
  }

  function createParentOverlay() {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483646;' +
      'background:none;border:2px dashed rgba(128,128,128,0.6);' +
      'transition:all 0.05s ease;border-radius:3px;';
    document.documentElement.appendChild(el);
    return el;
  }

  function createSelectedOverlay() {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483646;' +
      'background:rgba(0,180,80,0.15);border:2px solid rgba(0,180,80,0.6);' +
      'border-radius:3px;';
    document.documentElement.appendChild(el);
    return el;
  }

  function positionOverlayOn(overlayEl, targetEl) {
    const rect = targetEl.getBoundingClientRect();
    overlayEl.style.top = rect.top + 'px';
    overlayEl.style.left = rect.left + 'px';
    overlayEl.style.width = rect.width + 'px';
    overlayEl.style.height = rect.height + 'px';
  }

  function onMouseMove(e) {
    if (!pickerActive) return;
    positionOverlayOn(overlay, e.target);

    const parent = e.target.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      parentOverlay.style.display = '';
      positionOverlayOn(parentOverlay, parent);
    } else {
      parentOverlay.style.display = 'none';
    }
  }

  function onClick(e) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = e.target;

    if (shiftHeld) {
      selectedElements.push(target);
      const selOverlay = createSelectedOverlay();
      positionOverlayOn(selOverlay, target);
      selectedOverlays.push(selOverlay);
      return;
    }

    deactivate();
    convert([target]);
    showToast('Markdown copied!');
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      deactivate();
      return;
    }
    if (e.key === 'Shift') {
      shiftHeld = true;
    }
  }

  function onKeyUp(e) {
    if (e.key === 'Shift') {
      shiftHeld = false;
      if (selectedElements.length > 0) {
        const count = selectedElements.length;
        const elements = [...selectedElements];
        deactivate();
        convert(elements);
        showToast(`${count} elements copied!`);
      }
    }
  }

  function activate() {
    if (pickerActive) return;
    pickerActive = true;
    overlay = createOverlay();
    parentOverlay = createParentOverlay();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
  }

  function deactivate() {
    pickerActive = false;
    shiftHeld = false;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('keyup', onKeyUp, true);
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (parentOverlay) {
      parentOverlay.remove();
      parentOverlay = null;
    }
    selectedOverlays.forEach((o) => o.remove());
    selectedOverlays = [];
    selectedElements = [];
  }

  function convert(elements) {
    const td = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    const source = `[${document.title}](${location.href})`;
    const parts = elements.map((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('script, style, noscript').forEach((s) => s.remove());
      return td.turndown(clone);
    });

    const markdown = source + '\n\n' + parts.join('\n\n');
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
