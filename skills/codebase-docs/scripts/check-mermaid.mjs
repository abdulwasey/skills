// Parse every ```mermaid block under the given paths with the real Mermaid parser.
// Setup once: npm i mermaid@11 jsdom@25   Usage: node check-mermaid.mjs <docs-dir-or-file>...
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false });

const files = process.argv.slice(2).flatMap((p) =>
  fs.statSync(p).isDirectory()
    ? fs.readdirSync(p, { recursive: true }).filter((f) => f.endsWith('.md')).map((f) => path.join(p, f))
    : [p],
);
let bad = 0;
let total = 0;
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/```mermaid\n([\s\S]*?)```/g)) {
    total++;
    try {
      await mermaid.parse(m[1]);
    } catch (e) {
      bad++;
      console.log(`BAD ${f}: ${String(e.message).split('\n')[0]}`);
    }
  }
}
console.log(`${total} diagrams, ${bad} invalid`);
process.exit(bad ? 1 : 0);
