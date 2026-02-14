# Markdown Web Clipper

A browser extension for Chrome and Firefox that lets you pick any element on a page and copy it to your clipboard as Markdown.

<a href="https://chromewebstore.google.com/detail/markdown-web-clipper/bmnlhmbfgfjjjmdcapfhdfjeojlmiemg">
  <img src="https://developer.chrome.com/static/docs/webstore/branding/image/mPGKYBIR2uCP0ApchDXE.png" alt="Available in the Chrome Web Store" height="58">
</a>

<!-- Firefox Add-ons - uncomment when approved
<a href="https://addons.mozilla.org/en-US/firefox/addon/SLUG/">
  <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="Get the Add-on for Firefox" height="58">
</a>
-->

[Website](https://isaacmurtagh.github.io/md-web-clipper/)

![Element picker](docs/picker-light.png)

## How it works

1. Click the extension icon or press **⌘⇧.** to activate the picker
2. Hover over any element — use **↑↓** arrow keys to navigate to parent or child elements
3. Click to copy, or **⌘Click** to multi-select then **⌘C** to copy all
4. The Markdown is copied to your clipboard — paste it anywhere

![Multi-select](docs/multi-select-light.png)

## Features

- **Element picker** — hover and click to grab any element
- **Parent navigation** — arrow keys to walk up and down the DOM tree
- **Multi-select** — ⌘Click to select multiple elements, ⌘C to copy all
- **Tables** — HTML tables convert to clean GFM Markdown tables
- **Keyboard shortcut** — configurable via `chrome://extensions/shortcuts`

![Table copy](docs/table-copy-light.png)

## Install from source

1. Clone this repo
2. Open `chrome://extensions/` and enable **Developer mode**
3. Click **Load unpacked** and select the project folder
4. Navigate to any page and click the extension icon

## Third-party

This extension bundles [Turndown](https://github.com/mixmark-io/turndown) and [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) by Dom Christie (MIT License) for HTML-to-Markdown conversion.

## License

MIT — see [LICENSE](LICENSE) for details.
