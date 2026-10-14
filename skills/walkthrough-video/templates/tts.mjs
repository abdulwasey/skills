#!/usr/bin/env node
// Generates one WAV per narrated item into audio/<id>.wav with a local, free TTS engine.
// Usage: node tts.mjs [scenes.yaml] [--engine say|piper|kokoro] [--only <id>] [--force]
// Unchanged lines are skipped (a hash of engine settings + text is stored next to each WAV).
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, narrationItems, duration, words } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const engineArg = flag('--engine');
const only = flag('--only');
const force = args.includes('--force') && args.splice(args.indexOf('--force'), 1);
const cfg = loadConfig(args[0]);
const engine = engineArg ?? cfg.voice.engine;
const opts = cfg.voice[engine] ?? {};
const home = (p) => (p ? String(p).replace(/^~(?=\/|$)/, homedir()) : p);
const run = (cmd, argv, extra = {}) => execFileSync(cmd, argv, { stdio: ['pipe', 'pipe', 'pipe'], ...extra });

const engines = {
  // macOS built-in. Zero install. `say -v '?'` lists voices; rate is words per minute (most voices floor near 150).
  // A short [[slnc]] pause after each sentence keeps the pace closer to a human read.
  say(textFile, raw) {
    const pause = opts.sentencePause ?? 280;
    writeFileSync(textFile, readFileSync(textFile, 'utf8').replace(/([.!?])\s+(?=\S)/g, `$1 [[slnc ${pause}]] `));
    const argv = ['-f', textFile, '-o', raw + '.aiff'];
    if (opts.voice) argv.unshift('-v', opts.voice);
    if (opts.rate) argv.unshift('-r', String(opts.rate));
    run('say', argv);
    return raw + '.aiff';
  },
  // Piper (pip install piper-tts). model: path to a downloaded .onnx voice.
  piper(textFile, raw) {
    if (!opts.model) throw new Error('voice.piper.model must point at a .onnx voice (python -m piper.download_voices en_US-lessac-medium)');
    const argv = ['-m', home(opts.model), '-f', raw + '.wav'];
    if (opts.lengthScale) argv.push('--length-scale', String(opts.lengthScale));
    if (opts.speaker != null) argv.push('-s', String(opts.speaker));
    run(home(opts.bin) ?? 'piper', argv, { input: readFileSync(textFile) });
    return raw + '.wav';
  },
  // Kokoro-82M through the HyperFrames CLI. Needs a Python with kokoro-onnx + soundfile.
  kokoro(textFile, raw) {
    const python = home(opts.python ?? process.env.HYPERFRAMES_PYTHON);
    if (!python) throw new Error('set voice.kokoro.python (or HYPERFRAMES_PYTHON) to a python with kokoro-onnx installed');
    const argv = ['--no-install', 'hyperframes', 'tts', textFile, '--voice', opts.voice ?? 'af_heart', '--output', raw + '.wav'];
    if (opts.speed) argv.push('--speed', String(opts.speed));
    run('npx', argv, { env: { ...process.env, HYPERFRAMES_PYTHON: python, DO_NOT_TRACK: '1', HYPERFRAMES_NO_TELEMETRY: '1', HF_CLI_TELEMETRY_DISABLED: '1', HYPERFRAMES_SKIP_SKILLS: '1' } });
    return raw + '.wav';
  },
};
if (!engines[engine]) throw new Error(`unknown engine "${engine}" (say, piper, kokoro)`);

const dir = join(cfg.root, 'audio');
mkdirSync(dir, { recursive: true });
const rows = [];
for (const item of narrationItems(cfg)) {
  if (only && item.id !== only) continue;
  const out = join(dir, `${item.id}.wav`);
  const stamp = join(dir, `${item.id}.hash`);
  const hash = createHash('sha1').update(JSON.stringify([engine, opts, item.speak])).digest('hex');
  if (!force && existsSync(out) && existsSync(stamp) && readFileSync(stamp, 'utf8') === hash) {
    rows.push({ ...item, d: duration(out), cached: true });
    continue;
  }
  const textFile = join(dir, `.${item.id}.txt`);
  writeFileSync(textFile, item.speak + '\n');
  let raw;
  try {
    raw = engines[engine](textFile, join(dir, `.${item.id}.raw`));
  } catch (e) {
    console.error(`${item.id}: ${engine} failed\n${e.stderr?.toString() || e.message}`);
    process.exit(1);
  }
  // Trim leading/trailing silence so durations are true, normalise loudness, 48 kHz mono.
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05';
  run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', `${trim},areverse,${trim},areverse,loudnorm=I=-16:TP=-1.5:LRA=11`, '-ar', '48000', '-ac', '1', out]);
  rmSync(raw, { force: true });
  rmSync(textFile, { force: true });
  writeFileSync(stamp, hash);
  rows.push({ ...item, d: duration(out), cached: false });
}

let warn = 0;
for (const r of rows) {
  // Speech-only rate (edges trimmed), so it reads ~10-15% above a script's nominal wpm.
  const wpm = Math.round(words(r.text) / (r.d / 60));
  const notes = [];
  if (wpm > 190 && words(r.text) >= 8) notes.push('fast: cut words or slow the voice');
  if (r.d > 9) notes.push('long: split the scene');
  warn += notes.length;
  console.log(`${r.id.padEnd(14)} ${r.d.toFixed(2).padStart(6)}s ${String(wpm).padStart(4)} wpm${r.cached ? '  (cached)' : ''}${notes.length ? '  <- ' + notes.join(', ') : ''}`);
}
const total = rows.reduce((a, r) => a + r.d, 0);
console.log(`${'narration'.padEnd(14)} ${total.toFixed(2).padStart(6)}s total (${engine})${warn ? `, ${warn} warning(s)` : ''}`);
