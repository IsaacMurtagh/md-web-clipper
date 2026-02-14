// eslint-disable-next-line no-unused-vars
var convertToMarkdown = (function () {
  function convertToMarkdown(elements, documentTitle, pageUrl) {
    var td = new TurndownService({
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

    var source = '[' + documentTitle + '](' + pageUrl + ')';
    var parts = elements.map(function (el) {
      var clone = el.cloneNode(true);
      clone.querySelectorAll('script, style, noscript').forEach(function (s) { s.remove(); });
      // Add space between adjacent inline elements in table cells
      // so "Alex Taylor<span>merchant</span>" becomes "Alex Taylor merchant"
      clone.querySelectorAll('td, th').forEach(function (cell) {
        cell.childNodes.forEach(function (child) {
          if (child.nodeType === 1 && child.previousSibling) {
            cell.insertBefore(document.createTextNode(' '), child);
          }
        });
      });
      return td.turndown(clone);
    });

    return source + '\n\n' + parts.join('\n\n');
  }

  return convertToMarkdown;
})();
