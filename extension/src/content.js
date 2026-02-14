(() => {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

  let highlightColor = '#0066ff';
  let selectionColor = '#00b450';
  let includeSource = false;
  let welcomeBanner = null;

  let pickerActive = false;
  let overlay = null;
  let parentOverlay = null;
  let instructionBar = null;
  let currentTarget = null;
  let deepestTarget = null;
  let selectedElements = [];
  let selectedOverlays = [];

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function createOverlay() {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;' +
      `background:${hexToRgba(highlightColor, 0.15)};border:2px solid ${hexToRgba(highlightColor, 0.6)};` +
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
      `background:${hexToRgba(selectionColor, 0.15)};border:2px solid ${hexToRgba(selectionColor, 0.6)};` +
      'border-radius:3px;';
    document.documentElement.appendChild(el);
    return el;
  }

  function createInstructionBar() {
    const el = document.createElement('div');
    const shortcuts = [
      ['Click', 'Copy'],
      [isMac ? '\u2318 Click' : 'Ctrl Click', 'Multi-select'],
      [isMac ? '\u2318 C' : 'Ctrl C', 'Copy selected'],
      ['\u2191\u2193', 'Navigate'],
      ['Esc', 'Cancel'],
    ];
    el.style.cssText =
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'background:rgba(0,0,0,0.55);color:#fff;padding:10px 14px;border-radius:10px;' +
      'font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'pointer-events:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
      'display:flex;gap:12px;';
    shortcuts.forEach(([key, label]) => {
      const col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';
      const k = document.createElement('span');
      k.textContent = key;
      k.style.cssText =
        'font-weight:600;font-size:11px;color:#fff;' +
        'background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:4px;white-space:nowrap;';
      const l = document.createElement('span');
      l.textContent = label;
      l.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.5);white-space:nowrap;';
      col.appendChild(k);
      col.appendChild(l);
      el.appendChild(col);
    });
    document.documentElement.appendChild(el);
    return el;
  }

  function createWelcomeBanner() {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'background:rgba(0,0,0,0.75);color:#fff;padding:14px 20px;border-radius:12px;' +
      'font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
      'text-align:center;max-width:340px;cursor:pointer;' +
      'opacity:0;transition:opacity 0.3s;';

    el.innerHTML =
      '<div style="font-weight:600;margin-bottom:4px;">Welcome to Markdown Web Clipper!</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,0.7);">Hover over any element and click to copy it as Markdown. ' +
      'Check the controls below to get started, and visit the playground from settings to try it out.</div>';

    setTimeout(() => dismissWelcome(), 5000);

    document.documentElement.appendChild(el);
    requestAnimationFrame(() => (el.style.opacity = '1'));
    return el;
  }

  function flashInstructionBar() {
    if (!instructionBar) return;
    instructionBar.style.transition = 'transform 0.3s ease';
    instructionBar.style.transform = 'translateX(-50%) scale(1.08)';
    setTimeout(() => {
      instructionBar.style.transform = 'translateX(-50%) scale(1)';
      setTimeout(() => {
        instructionBar.style.transform = 'translateX(-50%) scale(1.08)';
        setTimeout(() => {
          instructionBar.style.transform = 'translateX(-50%) scale(1)';
        }, 300);
      }, 300);
    }, 300);
  }

  function dismissWelcome() {
    if (welcomeBanner) {
      welcomeBanner.style.opacity = '0';
      setTimeout(() => {
        welcomeBanner.remove();
        welcomeBanner = null;
        flashInstructionBar();
      }, 300);
    }
  }

  function positionOverlayOn(overlayEl, targetEl) {
    const rect = targetEl.getBoundingClientRect();
    overlayEl.style.top = rect.top + 'px';
    overlayEl.style.left = rect.left + 'px';
    overlayEl.style.width = rect.width + 'px';
    overlayEl.style.height = rect.height + 'px';
  }

  function updateOverlays() {
    if (!currentTarget) return;
    positionOverlayOn(overlay, currentTarget);

    const parent = currentTarget.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      parentOverlay.style.display = '';
      positionOverlayOn(parentOverlay, parent);
    } else {
      parentOverlay.style.display = 'none';
    }

    selectedElements.forEach((el, i) => {
      positionOverlayOn(selectedOverlays[i], el);
    });
  }

  function onScroll() {
    if (!pickerActive) return;
    updateOverlays();
  }

  function onMouseMove(e) {
    if (!pickerActive) return;
    currentTarget = e.target;
    deepestTarget = e.target;
    updateOverlays();
  }

  function selectElement(el, isMulti) {
    if (isMulti) {
      const idx = selectedElements.indexOf(el);
      if (idx !== -1) {
        selectedElements.splice(idx, 1);
        selectedOverlays[idx].remove();
        selectedOverlays.splice(idx, 1);
        return;
      }
      selectedElements.push(el);
      const selOverlay = createSelectedOverlay();
      positionOverlayOn(selOverlay, el);
      selectedOverlays.push(selOverlay);
      return;
    }

    if (selectedElements.length > 0) {
      selectedElements.push(el);
      const count = selectedElements.length;
      const elements = [...selectedElements];
      deactivate();
      convert(elements);
      showToast(`${count} elements copied!`);
    } else {
      deactivate();
      convert([el]);
      showToast('Copied!');
    }
  }

  function onClick(e) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    selectElement(currentTarget || e.target, isMac ? e.metaKey : e.ctrlKey);
  }

  function onKeyDown(e) {
    if (!pickerActive) return;

    if (e.key === 'Escape') {
      deactivate();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!currentTarget) return;
      const parent = currentTarget.parentElement;
      if (parent && parent !== document.body && parent !== document.documentElement) {
        currentTarget = parent;
        updateOverlays();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!currentTarget || !deepestTarget) return;
      // Walk from deepestTarget up to find the child of currentTarget
      let child = deepestTarget;
      while (child && child.parentElement !== currentTarget) {
        child = child.parentElement;
      }
      if (child && child !== currentTarget) {
        currentTarget = child;
        updateOverlays();
      }
      return;
    }

    if (e.key === 'c' && (isMac ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      if (selectedElements.length > 0) {
        const count = selectedElements.length;
        const elements = [...selectedElements];
        deactivate();
        convert(elements);
        showToast(`${count} elements copied!`);
      } else if (currentTarget) {
        deactivate();
        convert([currentTarget]);
        showToast('Copied!');
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!currentTarget) return;
      selectElement(currentTarget, isMac ? e.metaKey : e.ctrlKey);
    }
  }

  async function activate() {
    if (pickerActive) return;
    let walkthroughSeen = true;
    if (chrome.storage?.sync) {
      try {
        const values = await chrome.storage.sync.get({
          highlightColor: '#0066ff',
          selectionColor: '#00b450',
          includeSource: false,
          walkthroughSeen: false,
        });
        highlightColor = values.highlightColor;
        selectionColor = values.selectionColor;
        includeSource = values.includeSource;
        walkthroughSeen = values.walkthroughSeen;
      } catch {
        // storage unavailable, use defaults
      }
    }
    pickerActive = true;
    currentTarget = null;
    deepestTarget = null;
    overlay = createOverlay();
    parentOverlay = createParentOverlay();
    instructionBar = createInstructionBar();
    if (!walkthroughSeen && chrome.storage?.sync) {
      welcomeBanner = createWelcomeBanner();
      chrome.storage.sync.set({ walkthroughSeen: true });
    }
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('scroll', onScroll, true);
  }

  function deactivate() {
    pickerActive = false;
    currentTarget = null;
    deepestTarget = null;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('scroll', onScroll, true);
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (parentOverlay) {
      parentOverlay.remove();
      parentOverlay = null;
    }
    if (instructionBar) {
      instructionBar.remove();
      instructionBar = null;
    }
    if (welcomeBanner) {
      welcomeBanner.remove();
      welcomeBanner = null;
    }
    selectedOverlays.forEach((o) => o.remove());
    selectedOverlays = [];
    selectedElements = [];
  }

  function convert(elements) {
    const title = includeSource ? document.title : null;
    const url = includeSource ? location.href : null;
    const markdown = convertToMarkdown(elements, title, url);
    copyToClipboard(markdown);
  }

  async function copyToClipboard(markdown) {
    const html = marked.parse(markdown);
    try {
      const item = new ClipboardItem({
        'text/plain': new Blob([markdown], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      });
      await navigator.clipboard.write([item]);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = markdown;
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
      if (pickerActive) {
        deactivate();
      } else {
        activate();
      }
    }
  });
})();
