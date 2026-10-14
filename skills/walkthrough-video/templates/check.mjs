#!/usr/bin/env node
// Checks that the narration in the rendered MP4 lands where build/timeline.json says it should:
// finds speech with ffmpeg silencedetect and compares it with each scene's narration window.
// Usage: node check.mjs out/walkthrough.mp4
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { duration } from './lib.mjs';

const video = process.argv[2];
if (!video) throw new Error('usage: node check.mjs <video>');
const t = JSON.parse(readFileSync('build/timeline.json', 'utf8'));
const problems = [];

const real = duration(video);
if (Math.abs(real - t.duration) > 0.25) problems.push(`video is ${real.toFixed(2)}s, timeline says ${t.duration}s`);

const res = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-map', '0:a:0', '-af', 'silencedetect=noise=-38dB:d=0.3', '-f', 'null', '-'], { encoding: 'utf8' });
if (res.status !== 0) throw new Error(`ffmpeg failed on ${video}: does it have an audio track?\n${res.stderr.slice(-400)}`);
const silences = [];
let open = null;
for (const line of res.stderr.split('\n')) {
  const s = line.match(/silence_start: ([\d.]+)/);
  const e = line.match(/silence_end: ([\d.]+)/);
  if (s) open = parseFloat(s[1]);
  if (e) { silences.push([open ?? 0, parseFloat(e[1])]); open = null; }
}
if (open != null) silences.push([open, real]);
// Speech = the gaps between silences; join pauses shorter than 0.45 s (commas, sentence breaks).
const speech = [];
let cursor = 0;
for (const [a, b] of [...silences, [real, real]]) {
  if (a - cursor > 0.05) {
    const prev = speech.at(-1);
    if (prev && cursor - prev[1] < 0.45) prev[1] = a; else speech.push([cursor, a]);
  }
  cursor = b;
}

console.log(`${'part'.padEnd(14)} ${'expected'.padEnd(13)} ${'heard'.padEnd(13)} scene`);
for (const n of t.narration) {
  const end = n.start + n.dur;
  const heard = speech.filter(([a, b]) => b > n.start - 0.3 && a < end + 0.3);
  const h = heard.length ? [heard[0][0], heard.at(-1)[1]] : null;
  const flags = [];
  if (!h) flags.push('no speech heard');
  else {
    if (Math.abs(h[0] - n.start) > 0.3) flags.push(`starts ${(h[0] - n.start).toFixed(2)}s off`);
    if (h[1] > n.sceneEnd) flags.push('runs past the scene cut');
  }
  if (end > n.sceneEnd) flags.push('narration longer than scene');
  if (flags.length) problems.push(`${n.id}: ${flags.join(', ')}`);
  const fmt = (a, b) => `${a.toFixed(2)}-${b.toFixed(2)}`.padEnd(13);
  console.log(`${n.id.padEnd(14)} ${fmt(n.start, end)} ${h ? fmt(h[0], h[1]) : '-'.padEnd(13)} ${n.sceneStart.toFixed(2)}-${n.sceneEnd.toFixed(2)}${flags.length ? '  <- ' + flags.join(', ') : ''}`);
}
const stray = speech.filter(([a, b]) => !t.narration.some((n) => b > n.start - 0.3 && a < n.start + n.dur + 0.3));
if (stray.length && !t.music) problems.push(`sound outside any narration window at ${stray.map(([a]) => a.toFixed(2) + 's').join(', ')}`);

if (problems.length) {
  console.log('\nSYNC PROBLEMS\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`\nsync ok: ${t.narration.length} narration clips inside their scenes, ${real.toFixed(2)}s total`);
