(() => {
  let pickerActive = false;
  let overlay = null;
  let parentOverlay = null;
  let instructionBar = null;
  let currentTarget = null;
  let deepestTarget = null;
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

  function createInstructionBar() {
    const el = document.createElement('div');
    const shortcuts = [
      ['Click', 'Copy'],
      ['\u2318 Click', 'Multi-select'],
      ['\u2318 C', 'Copy selected'],
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
      showToast('Markdown copied!');
    }
  }

  function onClick(e) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    selectElement(currentTarget || e.target, e.metaKey);
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

    if (e.key === 'c' && e.metaKey) {
      e.preventDefault();
      if (selectedElements.length > 0) {
        const count = selectedElements.length;
        const elements = [...selectedElements];
        deactivate();
        convert(elements);
        showToast(`${count} element${count > 1 ? 's' : ''} copied!`);
      } else if (currentTarget) {
        deactivate();
        convert([currentTarget]);
        showToast('Markdown copied!');
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!currentTarget) return;
      selectElement(currentTarget, true);
    }
  }

  function activate() {
    if (pickerActive) return;
    pickerActive = true;
    currentTarget = null;
    deepestTarget = null;
    overlay = createOverlay();
    parentOverlay = createParentOverlay();
    instructionBar = createInstructionBar();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function deactivate() {
    pickerActive = false;
    currentTarget = null;
    deepestTarget = null;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
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
    td.use(turndownPluginGfm.gfm);

    // Override table cell rule to collapse multi-line content and add
    // spaces between inline elements that would otherwise concatenate.
    td.addRule('cleanTableCell', {
      filter: ['th', 'td'],
      replacement: function (content, node) {
        var index = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
        var prefix = index === 0 ? '| ' : ' ';
        var clean = content
          .replace(/\n/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .replace(/\|/g, '\\|')
          .trim();
        return prefix + clean + ' |';
      }
    });

    const source = `[${document.title}](${location.href})`;
    const parts = elements.map((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('script, style, noscript').forEach((s) => s.remove());
      // Add space between adjacent inline elements in table cells
      // so "Alex Taylor<span>merchant</span>" becomes "Alex Taylor merchant"
      clone.querySelectorAll('td, th').forEach((cell) => {
        cell.childNodes.forEach((child) => {
          if (child.nodeType === 1 && child.previousSibling) {
            cell.insertBefore(document.createTextNode(' '), child);
          }
        });
      });
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
      if (pickerActive) {
        deactivate();
      } else {
        activate();
      }
    }
  });
})();
