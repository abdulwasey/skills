// The motion layer that sits around the app: wallpaper, browser frame, scripted cursor with click
// ripples, notification toast, one-line caption, and a screenshot camera for non-React apps.
// Everything is a pure function of the frame: no CSS animation, no timers.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

// ---- background ----------------------------------------------------------
export const Wallpaper: React.FC<{ colors?: string[]; base?: string }> = ({
  colors = ['#3a2a8f', '#0f5e7a', '#a1306b', '#c2662d'],
  base = '#0b0d1a',
}) => {
  const { width: w, height: h } = useVideoConfig();
  const blobs = [
    [-0.12, -0.15, 0.6, 0.78],
    [0.4, 0.32, 0.64, 0.8],
    [0.67, -0.25, 0.48, 0.65],
    [0.06, 0.65, 0.48, 0.52],
  ];
  return (
    <AbsoluteFill style={{ background: base, overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: `blur(${Math.round(w * 0.07)}px) saturate(1.3)`, transform: 'scale(1.2)' }}>
        {blobs.map(([x, y, bw, bh], i) => (
          <div key={i} style={{ position: 'absolute', left: x * w, top: y * h, width: bw * w, height: bh * h, borderRadius: '50%', background: colors[i % colors.length], opacity: i === 3 ? 0.75 : 1 }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(5,6,15,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

// ---- frames --------------------------------------------------------------
export const BrowserFrame: React.FC<{ x: number; y: number; width: number; height: number; url?: string; children: React.ReactNode }> = ({ x, y, width, height, url, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width, height, borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}>
    <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#e9e9ee', fontFamily: FONT }}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <i key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
      ))}
      {url ? <div style={{ marginLeft: 18, flex: '0 1 520px', height: 26, borderRadius: 8, background: '#fff', color: '#555', fontSize: 14, lineHeight: '26px', padding: '0 12px' }}>{url}</div> : null}
    </div>
    <div style={{ position: 'relative', width, height: height - 40, overflow: 'hidden' }}>{children}</div>
  </div>
);

// ---- cursor --------------------------------------------------------------
export interface CursorKey {
  f: number; // frame
  x: number;
  y: number;
}

export const cursorAt = (frame: number, keys: CursorKey[]) => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { easing: Easing.bezier(0.45, 0, 0.2, 1) });
      return { f: frame, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
};

// 0..1 press depth around each click frame: 3 frames down, 8 frames up.
export const pressAt = (frame: number, clicks: number[]) =>
  clicks.reduce((acc, c) => {
    const d = frame - c;
    if (d < -3 || d > 8) return acc;
    return Math.max(acc, d < 0 ? (d + 3) / 3 : 1 - d / 8);
  }, 0);

// Feed this to <LiveApp pointer> so the app shows hover/press where the cursor is. Coordinates are
// composition pixels, which is what document.elementFromPoint sees during a render.
export const pointerAt = (frame: number, keys: CursorKey[], clicks: number[]) => {
  const { x, y } = cursorAt(frame, keys);
  return { x, y, pressed: pressAt(frame, clicks) > 0.3 };
};

export const Cursor: React.FC<{ keys: CursorKey[]; clicks: number[]; size?: number }> = ({ keys, clicks, size = 1 }) => {
  const frame = useCurrentFrame();
  const { x, y } = cursorAt(frame, keys);
  const press = pressAt(frame, clicks);
  const ripples = clicks.map((c) => (frame - c) / 14).filter((r) => r >= 0 && r <= 1);
  return (
    <>
      {ripples.map((r, i) => (
        <div key={i} style={{ position: 'absolute', left: x - 18 * size, top: y - 18 * size, width: 36 * size, height: 36 * size, borderRadius: '50%', border: `${2 * size}px solid rgba(255,255,255,0.85)`, opacity: 1 - r, transform: `scale(${0.4 + r * 0.9})`, zIndex: 99, pointerEvents: 'none' }} />
      ))}
      <svg width={26 * size} height={34 * size} viewBox="0 0 26 34" style={{ position: 'absolute', left: x - 3 * size, top: y - 2 * size, transform: `scale(${1 - press * 0.14})`, transformOrigin: `${3 * size}px ${2 * size}px`, zIndex: 100, pointerEvents: 'none', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
        <path d="M3 2 L3 26 L9 20.5 L13 30 L17 28.3 L13.1 19.1 L21 19.1 Z" fill="black" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </>
  );
};

// ---- caption -------------------------------------------------------------
// One big line, readable with the sound off. Fades/slides in at `from`, out at `to` (frames).
export const Caption: React.FC<{ text: string; from?: number; to?: number; bottom?: number; size?: number }> = ({ text, from = 0, to, bottom, size }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const end = to ?? durationInFrames;
  const inP = spring({ frame: frame - from, fps, config: { damping: 200 } });
  const outP = interpolate(frame, [end - 8, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fontSize = size ?? Math.round(Math.min(width, height) * 0.055);
  return (
    <div style={{ position: 'absolute', left: width * 0.06, right: width * 0.06, bottom: bottom ?? height * 0.08, textAlign: 'center', fontFamily: FONT, fontSize, fontWeight: 750, letterSpacing: '-0.025em', lineHeight: 1.12, color: 'white', textShadow: '0 2px 24px rgba(0,0,0,0.5)', opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * 18}px)`, zIndex: 30 }}>
      {text}
    </div>
  );
};

// ---- notification toast --------------------------------------------------
export interface Toast {
  at: number;
  until: number;
  title: string;
  body: string;
}

export const Notification: React.FC<{ toast: Toast; icon?: string; app: string; top?: number; right?: number }> = ({ toast, icon, app, top = 36, right = 12 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < toast.at || frame > toast.until + 12) return null;
  const inP = spring({ frame: frame - toast.at, fps, config: { damping: 20, stiffness: 200, mass: 0.7 } });
  const outP = interpolate(frame, [toast.until, toast.until + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  return (
    <div style={{ position: 'absolute', right, top, width: 360, padding: '12px 14px', borderRadius: 18, display: 'flex', gap: 11, alignItems: 'center', transform: `translateX(${(1 - inP) * 400 + outP * 400}px)`, background: 'rgba(48,48,56,0.78)', backdropFilter: 'blur(40px) saturate(1.8)', boxShadow: '0 0 0 0.5px rgba(255,255,255,0.16) inset, 0 12px 40px rgba(0,0,0,0.45)', color: 'white', fontFamily: FONT, zIndex: 40 }}>
      {icon ? <Img src={icon} style={{ width: 40, height: 40, flex: 'none', borderRadius: 9 }} /> : null}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{toast.title}</div>
        <div style={{ fontSize: 13, opacity: 0.88, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toast.body}</div>
        <div style={{ fontSize: 11.5, opacity: 0.5 }}>{app}</div>
      </div>
    </div>
  );
};

// ---- screenshot camera (apps that aren't React) ---------------------------
// keys: camera stops; cx/cy = point of the image (0-1) to centre, zoom = 1 fits the image to the box.
export interface CameraKey {
  f: number;
  cx: number;
  cy: number;
  zoom: number;
}

export const Shot: React.FC<{ src: string; imgW: number; imgH: number; box: { x: number; y: number; w: number; h: number }; keys: CameraKey[] }> = ({ src, imgW, imgH, box, keys }) => {
  const frame = useCurrentFrame();
  const at = (k: 'cx' | 'cy' | 'zoom') =>
    keys.length === 1 ? keys[0][k] : interpolate(frame, keys.map((c) => c.f), keys.map((c) => c[k]), { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const fit = Math.min(box.w / imgW, box.h / imgH);
  const s = fit * at('zoom');
  const left = box.w / 2 - at('cx') * imgW * s;
  const top = box.h / 2 - at('cy') * imgH * s;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', borderRadius: 14 }}>
      <Img src={src} style={{ position: 'absolute', left, top, width: imgW * s, height: imgH * s, maxWidth: 'none' }} />
    </div>
  );
};
