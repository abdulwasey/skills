#!/usr/bin/env node
// Reads scenes.yaml + audio/<id>.wav durations and writes a HyperFrames project to build/:
//   build/index.html      the composition (from composition.html)
//   build/assets/         screenshots, logo, font, vendored gsap.min.js
//   build/timeline.json   scene and narration timings (used by render.sh and check.mjs)
//   build/captions.srt    subtitles cut from the narration
// Usage: node build.mjs [scenes.yaml]
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, extname, resolve } from 'node:path';
import { loadConfig, narrationItems, duration, imageSize } from './lib.mjs';

const cfg = loadConfig(process.argv[2]);
const { video, timing } = cfg;
const W = video.width, H = video.height;
const u = Math.min(W, H) / 1080; // layout unit: 1 at 1080p, scales for 4K
const build = join(cfg.root, 'build');
const assets = join(build, 'assets');
rmSync(build, { recursive: true, force: true });
mkdirSync(assets, { recursive: true });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const r2 = (n) => Math.round(n * 100) / 100;
const src = (p) => resolve(cfg.root, p);
const asset = (from, name) => {
  if (!existsSync(src(from))) throw new Error(`missing file ${from}`);
  copyFileSync(src(from), join(assets, name));
  return `assets/${name}`;
};

// GSAP is vendored next to the composition: no CDN at render time.
const require = createRequire(join(cfg.root, 'package.json'));
copyFileSync(require.resolve('gsap/dist/gsap.min.js'), join(assets, 'gsap.min.js'));

// ---- timing -------------------------------------------------------------
const audio = Object.fromEntries(narrationItems(cfg).map((it) => {
  const file = join(cfg.root, 'audio', `${it.id}.wav`);
  if (!existsSync(file)) throw new Error(`no audio for "${it.id}": run node tts.mjs first`);
  return [it.id, { ...it, file, d: duration(file) }];
}));

const T = timing.transition;
const parts = [];
if (cfg.intro) parts.push({ id: 'intro', kind: 'intro', node: cfg.intro });
cfg.scenes.forEach((s) => parts.push({ id: s.id, kind: 'scene', node: s }));
if (cfg.outro) parts.push({ id: 'outro', kind: 'outro', node: cfg.outro });

let t = 0;
for (const p of parts) {
  const a = audio[p.id];
  const lead = p.node.lead ?? timing.lead;
  const tail = (p.node.tail ?? timing.tail) + (p.kind === 'outro' ? 0.6 : 0);
  const min = p.kind === 'scene' ? timing.minScene : 3;
  p.start = r2(t);
  p.voStart = r2(t + lead);
  p.voDur = a ? r2(a.d) : 0;
  p.dur = r2(Math.max(min, lead + p.voDur + tail) + (p.node.hold ?? 0));
  t += p.dur;
}
const total = r2(t);

// ---- geometry -----------------------------------------------------------
const pad = Math.round(64 * u);
const capH = Math.round(92 * u);
const stage = { x: pad, y: pad + capH, w: W - 2 * pad, h: H - 2 * pad - capH };
const chromeH = { browser: 44 * u, window: 36 * u, phone: 0, none: 0 };
const bezel = { phone: 16 * u };

const rect = (v, iw, ih, label) => {
  if (!v) return null;
  const a = Array.isArray(v) ? v : [v.x, v.y, v.w ?? 0, v.h ?? 0];
  if (a.some((n) => typeof n !== 'number')) throw new Error(`${label}: use [x, y, w, h] numbers`);
  const frac = a.every((n) => n <= 1);
  return { x: frac ? a[0] * iw : a[0], y: frac ? a[1] * ih : a[1], w: frac ? a[2] * iw : a[2], h: frac ? a[3] * ih : a[3] };
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function sceneGeometry(p) {
  const s = p.node;
  const kind = s.frame ?? video.frame;
  if (!(kind in chromeH)) throw new Error(`scene "${p.id}": frame must be browser, window, phone or none`);
  const ext = extname(s.image).toLowerCase();
  const img = imageSize(src(s.image));
  const ch = chromeH[kind], bz = bezel[kind] ?? 0;
  const s0 = Math.min((stage.w - 2 * bz) / img.w, (stage.h - ch - 2 * bz) / img.h);
  const fw = img.w * s0 + 2 * bz, fh = img.h * s0 + ch + 2 * bz;
  const fx = stage.x + (stage.w - fw) / 2, fy = stage.y + (stage.h - fh) / 2;
  const ix = fx + bz, iy = fy + bz + ch; // image origin on the canvas
  const toCanvas = (r) => r && { x: ix + r.x * s0, y: iy + r.y * s0, w: r.w * s0, h: r.h * s0 };

  const focus = toCanvas(rect(s.focus, img.w, img.h, `${p.id}.focus`));
  const hl = toCanvas(rect(s.highlight, img.w, img.h, `${p.id}.highlight`));
  const point = (v, label) => {
    const r = v && rect([...v, 0, 0].slice(0, 4), img.w, img.h, label);
    return r && { x: ix + r.x * s0, y: iy + r.y * s0 };
  };
  const click = point(s.click, `${p.id}.click`);
  const cursorFrom = point(s.cursorFrom, `${p.id}.cursorFrom`);

  // Camera: scale z about the canvas origin, then translate so the focus centre sits at the stage centre,
  // without pulling the frame's edge inside the stage when there is enough frame to fill it.
  let z = 1, tx = 0, ty = 0;
  if (focus) {
    const fit = Math.min(stage.w / focus.w, stage.h / focus.h) * 0.88;
    z = clamp(typeof s.zoom === 'number' ? s.zoom : fit, 1, s.maxZoom ?? 2.4);
    const scx = stage.x + stage.w / 2, scy = stage.y + stage.h / 2;
    tx = scx - z * (focus.x + focus.w / 2);
    ty = scy - z * (focus.y + focus.h / 2);
    if (fw * z >= stage.w) tx = clamp(tx, stage.x + stage.w - z * (fx + fw), stage.x - z * fx);
    else tx = scx - z * (fx + fw / 2);
    if (fh * z >= stage.h) ty = clamp(ty, stage.y + stage.h - z * (fy + fh), stage.y - z * fy);
    else ty = scy - z * (fy + fh / 2);
  }
  const screen = (pt) => pt && { x: z * pt.x + tx, y: z * pt.y + ty };
  // Same end state, but scaled about the focus centre so the focus glides in a straight line while
  // zooming (scaling about 0,0 while translating makes the frame swing sideways mid-move).
  const origin = focus ? { x: focus.x + focus.w / 2, y: focus.y + focus.h / 2 } : { x: W / 2, y: H / 2 };
  const move = { x: tx + (z - 1) * origin.x, y: ty + (z - 1) * origin.y };
  return { kind, ext, img, s0, fx, fy, fw, fh, ch, bz, focus, hl, click, cursorFrom, z, tx, ty, screen, origin, move };
}

// ---- per-scene animation plan ------------------------------------------
const data = { width: W, height: H, duration: total, u, scenes: [] };
let clips = '';
let stepNo = 0;
parts.forEach((p, i) => {
  const s = p.node;
  const last = i === parts.length - 1;
  const transition = i === 0 ? 'none' : s.transition ?? cfg.timing.style ?? 'fade';
  const visible = r2(p.dur + (last ? 0 : T));
  const base = { id: p.id, kind: p.kind, start: p.start, dur: p.dur, transition, T };
  const attrs = `id="sc-${p.id}" class="clip scene ${p.kind === 'scene' ? '' : 'card'}" data-start="${p.start}" data-duration="${visible}" data-track-index="${i % 2 ? 2 : 1}" style="z-index:${i + 1}"`;

  if (p.kind !== 'scene') {
    const logo = s.logo ?? (p.kind === 'intro' ? video.logo : null);
    const logoTag = logo ? `<img class="logo r" src="${asset(logo, `logo${extname(logo)}`)}" alt="" />` : '';
    const eyebrow = s.eyebrow ? `<div class="eyebrow r">${esc(s.eyebrow)}</div>` : '';
    const cta = s.cta ? `<div class="cta r">${esc(s.cta)}</div>` : '';
    clips += `
      <section ${attrs}>
        <div class="card-inner">${logoTag}${eyebrow}
          <h1 class="r">${esc(s.title)}</h1>
          <div class="rule r"></div>
          ${s.subtitle ? `<p class="r">${esc(s.subtitle)}</p>` : ''}${cta}
        </div>
      </section>`;
    data.scenes.push(base);
    return;
  }

  stepNo += 1;
  const g = sceneGeometry(p);
  const img = asset(s.image, `${p.id}${g.ext}`);
  const zoomAt = 0.2, zoomDur = g.focus ? 1.2 : 0;
  const settled = zoomAt + zoomDur;
  let clickAt = null, hlAt = null, cursor = null;
  if (g.click) {
    const want = p.voStart - p.start + p.voDur * (s.clickAt ?? 0.5);
    clickAt = r2(clamp(want, settled + 0.9, p.dur - 0.5));
    const to = g.screen(g.click);
    const from = g.cursorFrom
      ? g.screen(g.cursorFrom)
      : { x: clamp(to.x + 300 * u, 80 * u, W - 80 * u), y: clamp(to.y + 220 * u, 80 * u, H - 80 * u) };
    const moveDur = r2(clamp(clickAt - settled + 0.2, 0.6, 1.1));
    cursor = { from: { x: r2(from.x), y: r2(from.y) }, to: { x: r2(to.x), y: r2(to.y) }, appear: r2(Math.max(0.3, clickAt - moveDur - 0.45)), move: r2(clickAt - moveDur - 0.1), moveDur, at: clickAt };
  }
  if (g.hl) hlAt = r2(clickAt != null ? clickAt + 0.12 : s.highlightAt != null ? p.voStart - p.start + p.voDur * s.highlightAt : settled - 0.1);

  const origin = g.focus ? g.screen({ x: g.focus.x + g.focus.w / 2, y: g.focus.y + g.focus.h / 2 }) : { x: W / 2, y: H / 2 };
  const url = s.url ?? video.url;
  const chrome = g.kind === 'browser'
    ? `<div class="chrome" style="height:${r2(g.ch)}px"><i></i><i></i><i></i>${url ? `<span class="url">${esc(url)}</span>` : ''}</div>`
    : g.kind === 'window' ? `<div class="chrome" style="height:${r2(g.ch)}px"><i></i><i></i><i></i></div>` : '';
  const hl = g.hl
    ? `<div class="hl" id="hl-${p.id}" style="left:${r2(g.hl.x)}px;top:${r2(g.hl.y)}px;width:${r2(g.hl.w)}px;height:${r2(g.hl.h)}px;border-width:${r2(4 * u / g.z)}px;border-radius:${r2(12 * u / g.z)}px"></div>`
    : '';
  const caption = s.caption ?? '';
  clips += `
      <section ${attrs}>
        <div class="drift" id="dr-${p.id}" style="transform-origin:${r2(origin.x)}px ${r2(origin.y)}px">
          <div class="cam" id="cam-${p.id}" style="transform-origin:${r2(g.origin.x)}px ${r2(g.origin.y)}px">
            <div class="frame frame-${g.kind}" style="left:${r2(g.fx)}px;top:${r2(g.fy)}px;width:${r2(g.fw)}px;height:${r2(g.fh)}px">
              ${chrome}<img src="${img}" alt="" style="left:${r2(g.bz)}px;top:${r2(g.bz + g.ch)}px;width:${r2(g.img.w * g.s0)}px;height:${r2(g.img.h * g.s0)}px" />
            </div>
            ${hl}
          </div>
          ${cursor ? `<div class="ripple" id="rp-${p.id}"></div><svg class="cursor" id="cur-${p.id}" viewBox="0 0 24 24"><path d="M4 2.5l15.5 9.2-6.9 1.5-3.5 6.7z" /></svg>` : ''}
        </div>
        ${caption ? `<div class="caption" id="cap-${p.id}"><b>${stepNo}</b><span>${esc(caption)}</span></div>` : ''}
      </section>`;
  data.scenes.push({ ...base, z: r2(g.z), tx: r2(g.move.x), ty: r2(g.move.y), focus: !!g.focus, zoomAt, zoomDur, hlAt, cursor, caption: !!caption });
});

// ---- theme + template ---------------------------------------------------
const theme = { background: '#0b0d17', accent: '#6d5dfc', accent2: '#16b3a8', text: '#ffffff', ...cfg.theme, ...video.theme };
let fontFace = '';
let family = theme.font ?? 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
if (theme.fontFile) {
  fontFace = `@font-face { font-family: "Walkthrough"; src: url("${asset(theme.fontFile, `font${extname(theme.fontFile)}`)}"); font-weight: 100 900; }`;
  family = `"Walkthrough", ${family}`;
}
const css = `${fontFace}
      :root { --w: ${W}px; --h: ${H}px; --u: ${u}; --bg: ${theme.background}; --accent: ${theme.accent}; --accent2: ${theme.accent2}; --text: ${theme.text}; --font: ${family}; }`;

const template = readFileSync(join(cfg.root, 'composition.html'), 'utf8');
const html = template
  .replaceAll('__WIDTH__', String(W))
  .replaceAll('__HEIGHT__', String(H))
  .replaceAll('__DURATION__', String(total))
  .replace('/*__THEME__*/', css)
  .replace('<!--__CLIPS__-->', clips.trim() + (video.progress === false ? '' : `\n      <div id="progress" class="clip" data-start="0" data-duration="${total}" data-track-index="3"><i id="progress-bar"></i></div>`))
  .replace('/*__DATA__*/null', JSON.stringify(data));
writeFileSync(join(build, 'index.html'), html);
writeFileSync(join(build, 'hyperframes.json'), JSON.stringify({ paths: { assets: 'assets' } }, null, 2) + '\n');
writeFileSync(join(build, 'meta.json'), JSON.stringify({ id: 'walkthrough', name: video.title ?? 'walkthrough' }, null, 2) + '\n');

// ---- subtitles ------------------------------------------------------------
const MAX = 42;
function cues(text) {
  const out = [];
  const split = (s) => {
    if (s.length <= MAX * 2) return out.push(s);
    const mid = s.length / 2;
    const breaks = [...s.matchAll(/[,;:—–]\s|\s(?=(and|but|or|so|then|to|with|for|in|on)\s)/g)].map((m) => m.index + 1);
    const at = breaks.length ? breaks.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : s.lastIndexOf(' ', mid);
    split(s.slice(0, at).trim());
    split(s.slice(at).trim());
  };
  text.split(/(?<=[.!?])\s+/).forEach(split);
  return out;
}
function wrap(s) {
  if (s.length <= MAX) return s;
  let best = null;
  for (let i = s.indexOf(' '); i > 0; i = s.indexOf(' ', i + 1)) {
    const a = s.slice(0, i), b = s.slice(i + 1);
    if (a.length > MAX || b.length > MAX) continue;
    const score = Math.abs(a.length - b.length) + (b.length >= a.length ? 0 : 3);
    if (!best || score < best.score) best = { score, text: `${a}\n${b}` };
  }
  return best?.text ?? s;
}
const stamp = (sec) => {
  const ms = Math.round(sec * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
let srt = '', n = 0;
const narration = [];
for (const p of parts) {
  const a = audio[p.id];
  if (!a) continue;
  narration.push({ id: p.id, file: a.file, start: p.voStart, dur: p.voDur, sceneStart: p.start, sceneEnd: r2(p.start + p.dur) });
  const list = cues(a.text);
  const chars = list.reduce((x, c) => x + c.length, 0);
  let at = p.voStart;
  for (const c of list) {
    const d = (c.length / chars) * p.voDur;
    srt += `${++n}\n${stamp(at)} --> ${stamp(at + d)}\n${wrap(c)}\n\n`;
    at += d;
  }
}
writeFileSync(join(build, 'captions.srt'), srt);
writeFileSync(join(build, 'timeline.json'), JSON.stringify({
  width: W, height: H, fps: video.fps, duration: total,
  music: video.music ? { file: src(video.music), volume: video.musicVolume ?? 0.12 } : null,
  scenes: data.scenes.map((s) => ({ id: s.id, kind: s.kind, start: s.start, end: r2(s.start + s.dur), click: s.cursor?.at != null ? r2(s.start + s.cursor.at) : null })),
  narration,
}, null, 2) + '\n');

console.log(`${'part'.padEnd(14)} ${'start'.padStart(6)} ${'dur'.padStart(6)}  voice      zoom  click`);
for (const s of data.scenes) {
  const v = narration.find((x) => x.id === s.id);
  console.log(`${s.id.padEnd(14)} ${s.start.toFixed(2).padStart(6)} ${s.dur.toFixed(2).padStart(6)}  ${v ? `${v.start.toFixed(2)}+${v.dur.toFixed(2)}`.padEnd(10) : '-'.padEnd(10)} ${s.z ? s.z.toFixed(2) : '   -'}  ${s.cursor ? (s.start + s.cursor.at).toFixed(2) : '-'}`);
}
console.log(`total ${total}s, ${W}x${H}, ${parts.length} parts -> build/index.html`);
if (total > 75) console.log('warning: over 75 s. Cut scenes or narration; walkthroughs land best at 30-60 s.');
