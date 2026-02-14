import { readFileSync } from 'fs';
import { join } from 'path';
import { runInThisContext } from 'vm';

const root = join(import.meta.dirname, '..');

function loadScript(relativePath) {
  const code = readFileSync(join(root, relativePath), 'utf-8');
  runInThisContext(code, { filename: relativePath });
}

loadScript('extension/lib/turndown.js');
loadScript('extension/lib/turndown-plugin-gfm.js');
loadScript('extension/src/converter.js');
