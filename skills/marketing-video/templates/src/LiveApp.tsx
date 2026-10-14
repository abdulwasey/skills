// Hosts the app's REAL React components inside a Remotion frame and makes every frame deterministic:
//  1. time is pinned to the frame (clock.ts),
//  2. the mock handler is swapped to this frame's scripted data (mock.ts),
//  3. the app is remounted per frame (key={frame}) and the frame is held with delayRender()
//     until effects and async loads have settled,
//  4. CSS animations/transitions are off; motion that matters is driven from --frame / --t,
//  5. hover/press under the scripted cursor is faked with .fake-hover / .fake-active classes.
import React, { useEffect, useRef, useState } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { setClock } from './clock';
import { setMockHandler, type MockHandler } from './mock';

export interface Pointer {
  x: number; // composition pixels
  y: number;
  pressed: boolean;
}

interface Props {
  children: React.ReactNode; // the app's root component, wrapped in its providers
  handler: (frame: number) => MockHandler;
  css?: string; // the app's stylesheet, imported with `?raw`
  overrides?: string; // extra CSS: frame-driven spinners, hidden dev banners, ...
  settle?: (root: HTMLElement, frame: number) => void; // last-moment DOM tweaks (scroll position, focus)
  pointer?: Pointer | null;
  hoverable?: string; // selector for elements that react to the fake pointer
  settleMs?: number; // raise if the app needs more than one tick to load
}

const FREEZE = `
.live-app *, .live-app *::before, .live-app *::after {
  animation: none !important; transition: none !important; caret-color: transparent !important;
}
.live-app ::-webkit-scrollbar { display: none; }
`;

// The app's own :hover/:active rules, re-targeted at the classes the fake pointer sets.
export const hoverize = (css: string) => css.replace(/:hover\b/g, '.fake-hover').replace(/:active\b/g, '.fake-active');

// Pin a colour scheme regardless of the render machine: forceMedia(css, 'prefers-color-scheme: dark').
export const forceMedia = (css: string, query: string) =>
  css.replace(new RegExp(`@media\\s*\\(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}\\)`, 'g'), '@media all');

const applyPointer = (root: HTMLElement, p: Pointer | null | undefined, hoverable: string) => {
  if (!p) return;
  const hit = document.elementFromPoint(p.x, p.y);
  if (!hit || !root.contains(hit)) return;
  const el = hit.closest(hoverable);
  if (!el) return;
  el.classList.add('fake-hover');
  if (p.pressed) el.classList.add('fake-active');
};

const Mounted: React.FC<{
  frame: number;
  settleMs: number;
  settle?: Props['settle'];
  pointer?: Pointer | null;
  hoverable: string;
  children: React.ReactNode;
}> = ({ frame, settleMs, settle, pointer, hoverable, children }) => {
  const [handle] = useState(() => delayRender(`app frame ${frame}`));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      continueRender(handle);
    };
    const t = window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (ref.current) {
          settle?.(ref.current, frame);
          applyPointer(ref.current, pointer, hoverable);
        }
        requestAnimationFrame(finish);
      });
    }, settleMs);
    return () => {
      window.clearTimeout(t);
      finish();
    };
  }, [frame, handle, settle, pointer, hoverable, settleMs]);
  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
};

export const LiveApp: React.FC<Props> = ({
  children,
  handler,
  css = '',
  overrides = '',
  settle,
  pointer,
  hoverable = 'button, a, [role="button"], [role="menuitem"], li',
  settleMs = 60,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  setClock(frame, fps);
  setMockHandler(handler(frame));
  const style = { width: '100%', height: '100%', '--frame': frame, '--t': frame / fps } as React.CSSProperties;
  return (
    <div className="live-app" style={style}>
      <style>{css + hoverize(css) + FREEZE + overrides}</style>
      <Mounted key={frame} frame={frame} settleMs={settleMs} settle={settle} pointer={pointer} hoverable={hoverable}>
        {children}
      </Mounted>
    </div>
  );
};
