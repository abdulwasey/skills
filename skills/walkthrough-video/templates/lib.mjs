import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

export function loadConfig(file = 'scenes.yaml') {
  const path = resolve(file);
  if (!existsSync(path)) throw new Error(`No scene file at ${path}`);
  const cfg = parse(readFileSync(path, 'utf8')) ?? {};
  cfg.root = dirname(path);
  cfg.video = { width: 1920, height: 1080, fps: 30, frame: 'window', ...cfg.video };
  cfg.voice = { engine: 'say', ...cfg.voice };
  cfg.timing = { lead: 0.5, tail: 0.7, transition: 0.5, minScene: 2.5, ...cfg.timing };
  cfg.scenes = cfg.scenes ?? [];
  if (!cfg.scenes.length) throw new Error('scenes: needs at least one scene');
  const ids = new Set();
  for (const [i, s] of cfg.scenes.entries()) {
    s.id = String(s.id ?? `scene-${i + 1}`);
    if (!/^[a-z0-9-]+$/.test(s.id)) throw new Error(`scene id "${s.id}" must be lowercase letters, digits and dashes`);
    if (ids.has(s.id) || s.id === 'intro' || s.id === 'outro') throw new Error(`duplicate or reserved scene id "${s.id}"`);
    ids.add(s.id);
    if (!s.image) throw new Error(`scene "${s.id}" has no image`);
  }
  return cfg;
}

// Every narrated item in play order: intro card, scenes, outro card.
export function narrationItems(cfg) {
  const out = [];
  const add = (id, kind, node) => {
    if (node?.narration) out.push({ id, kind, text: String(node.narration).trim(), speak: String(node.speak ?? node.narration).trim() });
  };
  add('intro', 'intro', cfg.intro);
  for (const s of cfg.scenes) add(s.id, 'scene', s);
  add('outro', 'outro', cfg.outro);
  return out;
}

export function duration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const d = parseFloat(out);
  if (!Number.isFinite(d)) throw new Error(`ffprobe could not read a duration from ${file}`);
  return d;
}

// Width and height from a PNG or JPEG header, so no image library is needed.
export function imageSize(file) {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  throw new Error(`${file}: only PNG and JPEG screenshots are supported`);
}

export const words = (t) => t.split(/\s+/).filter(Boolean).length;
