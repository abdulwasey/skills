// Parse every mermaid code block in the docs with the real Mermaid parser.
// Setup once, from the docs root: npm i --prefix scripts mermaid@11.4.1 jsdom@25.0.1
// Usage: node scripts/check-mermaid.mjs <docs-dir-or-file>...   Exits 1 on any invalid diagram.
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false });

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node check-mermaid.mjs <docs-dir-or-file>...');
  process.exit(2);
}

const skip = (name) => name.startsWith('.') || name.startsWith('_') || name === 'node_modules';
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (skip(e.name) || e.isSymbolicLink()) return [];
    return e.isDirectory() ? walk(p) : e.name.endsWith('.md') ? [p] : [];
  });
const files = args.flatMap((p) => (fs.statSync(p).isDirectory() ? walk(p) : [p]));

function* mermaidBlocks(text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/);
    if (!open) continue;
    const fence = open[1];
    const close = new RegExp(`^ {0,3}${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`);
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j])) j++;
    if (open[2].toLowerCase() === 'mermaid') yield { line: i + 1, code: lines.slice(i + 1, j).join('\n') };
    i = j;
  }
}

let bad = 0;
let total = 0;
for (const f of files) {
  for (const { line, code } of mermaidBlocks(fs.readFileSync(f, 'utf8'))) {
    total++;
    try {
      await mermaid.parse(code);
    } catch (e) {
      bad++;
      console.log(`BAD ${f}:${line}: ${String(e.message).split('\n')[0]}`);
    }
  }
}
console.log(`${files.length} files, ${total} diagrams, ${bad} invalid`);
process.exit(bad ? 1 : 0);
