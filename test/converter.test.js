import { describe, it, expect } from 'vitest';

function html(strings) {
  const container = document.createElement('div');
  container.innerHTML = strings.raw ? strings.raw[0] : strings;
  return container;
}

function convert(elements, title, url) {
  title = title || 'Test Page';
  url = url || 'https://example.com';
  return convertToMarkdown(elements, title, url);
}

describe('convertToMarkdown', () => {
  it('prepends source link', () => {
    const el = html`<p>Hello</p>`;
    const md = convert([el]);
    expect(md).toMatch(/^\[Test Page\]\(https:\/\/example\.com\)/);
  });

  it('converts headings to atx style', () => {
    const el = html`<h1>Title</h1>`;
    const md = convert([el]);
    expect(md).toContain('# Title');
  });

  it('converts h2 and h3', () => {
    const el = html`<h2>Sub</h2>`;
    const md = convert([el]);
    expect(md).toContain('## Sub');
  });

  it('converts paragraphs', () => {
    const el = html`<p>Some text here.</p>`;
    const md = convert([el]);
    expect(md).toContain('Some text here.');
  });

  it('converts links', () => {
    const el = html`<a href="https://example.com">click</a>`;
    const md = convert([el]);
    expect(md).toContain('[click](https://example.com)');
  });

  it('converts images', () => {
    const el = html`<img src="https://example.com/img.png" alt="photo">`;
    const md = convert([el]);
    expect(md).toContain('![photo](https://example.com/img.png)');
  });

  it('converts unordered lists with dash markers', () => {
    const el = html`<ul><li>one</li><li>two</li></ul>`;
    const md = convert([el]);
    expect(md).toMatch(/-\s+one/);
    expect(md).toMatch(/-\s+two/);
    expect(md).not.toMatch(/\*/);
  });

  it('converts ordered lists', () => {
    const el = html`<ol><li>first</li><li>second</li></ol>`;
    const md = convert([el]);
    expect(md).toMatch(/1\.\s+first/);
    expect(md).toMatch(/2\.\s+second/);
  });

  it('converts fenced code blocks', () => {
    const el = html`<pre><code>const x = 1;</code></pre>`;
    const md = convert([el]);
    expect(md).toContain('```');
    expect(md).toContain('const x = 1;');
  });

  it('converts blockquotes', () => {
    const el = html`<blockquote><p>quoted</p></blockquote>`;
    const md = convert([el]);
    expect(md).toContain('> quoted');
  });

  it('converts bold and italic', () => {
    const el = html`<p><strong>bold</strong> and <em>italic</em></p>`;
    const md = convert([el]);
    expect(md).toContain('**bold**');
    expect(md).toContain('_italic_');
  });

  it('strips script tags', () => {
    const el = html`<div><p>keep</p><script>alert(1)</script></div>`;
    const md = convert([el]);
    expect(md).toContain('keep');
    expect(md).not.toContain('alert');
  });

  it('strips style tags', () => {
    const el = html`<div><p>keep</p><style>.x{color:red}</style></div>`;
    const md = convert([el]);
    expect(md).toContain('keep');
    expect(md).not.toContain('color:red');
  });

  it('strips noscript tags', () => {
    const el = html`<div><p>keep</p><noscript>fallback</noscript></div>`;
    const md = convert([el]);
    expect(md).toContain('keep');
    expect(md).not.toContain('fallback');
  });

  it('joins multiple elements with double newlines', () => {
    const el1 = html`<p>first</p>`;
    const el2 = html`<p>second</p>`;
    const md = convert([el1, el2]);
    const body = md.split('\n\n').slice(1).join('\n\n');
    expect(body).toContain('first');
    expect(body).toContain('second');
    expect(body).toMatch(/first\n\nsecond/);
  });

  it('does not mutate original elements', () => {
    const el = html`<div><p>text</p><script>x</script></div>`;
    const scriptsBefore = el.querySelectorAll('script').length;
    convert([el]);
    const scriptsAfter = el.querySelectorAll('script').length;
    expect(scriptsAfter).toBe(scriptsBefore);
  });

  it('handles empty elements', () => {
    const el = html`<div></div>`;
    const md = convert([el]);
    expect(md).toContain('[Test Page](https://example.com)');
  });

  describe('tables', () => {
    it('converts a basic table to GFM', () => {
      const el = html`
        <table>
          <thead><tr><th>Name</th><th>Age</th></tr></thead>
          <tbody><tr><td>Alice</td><td>30</td></tr></tbody>
        </table>`;
      const md = convert([el]);
      expect(md).toContain('| Name | Age |');
      expect(md).toContain('| Alice | 30 |');
      expect(md).toMatch(/\|[\s-]+\|[\s-]+\|/);
    });

    it('escapes pipes in cell content', () => {
      const el = html`
        <table>
          <thead><tr><th>Expression</th></tr></thead>
          <tbody><tr><td>a | b</td></tr></tbody>
        </table>`;
      const md = convert([el]);
      expect(md).toContain('a \\| b');
    });

    it('collapses multi-line cell content', () => {
      const el = html`
        <table>
          <thead><tr><th>Info</th></tr></thead>
          <tbody><tr><td><p>line one</p><p>line two</p></td></tr></tbody>
        </table>`;
      const md = convert([el]);
      const lines = md.split('\n').filter(l => l.includes('line one'));
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('line one');
      expect(lines[0]).toContain('line two');
    });

    it('adds spacing between inline elements in cells', () => {
      const el = html`
        <table>
          <thead><tr><th>User</th></tr></thead>
          <tbody><tr><td>Alex Taylor<span>merchant</span></td></tr></tbody>
        </table>`;
      const md = convert([el]);
      expect(md).toMatch(/Alex Taylor\s+merchant/);
    });
  });

  describe('GFM features', () => {
    it('converts strikethrough', () => {
      const el = html`<p><del>removed</del></p>`;
      const md = convert([el]);
      expect(md).toMatch(/~+removed~+/);
    });

    it('converts task lists', () => {
      const el = html`
        <ul>
          <li><input type="checkbox" checked> Done</li>
          <li><input type="checkbox"> Todo</li>
        </ul>`;
      const md = convert([el]);
      expect(md).toContain('[x]');
      expect(md).toContain('[ ]');
    });
  });

  describe('nested structures', () => {
    it('converts nested lists', () => {
      const el = html`
        <ul>
          <li>parent
            <ul>
              <li>child</li>
            </ul>
          </li>
        </ul>`;
      const md = convert([el]);
      expect(md).toMatch(/-\s+parent/);
      expect(md).toContain('child');
    });

    it('converts links inside headings', () => {
      const el = html`<h2><a href="https://example.com">Linked Heading</a></h2>`;
      const md = convert([el]);
      expect(md).toContain('## [Linked Heading](https://example.com)');
    });
  });

  it('uses provided title and url in source link', () => {
    const el = html`<p>content</p>`;
    const md = convertToMarkdown([el], 'My Page', 'https://my.site/page');
    expect(md).toMatch(/^\[My Page\]\(https:\/\/my\.site\/page\)/);
  });
});
