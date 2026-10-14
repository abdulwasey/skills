// Example scene (verified end to end): a fetch-based React app rendered with scripted per-frame data.
// The app's App.tsx and styles.css are imported unchanged via the '@app' alias (remotion.config.ts).
// Story: 3 items -> cursor clicks Done -> 2 items -> a new message arrives -> 3 items (= first frame).
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import App from '@app/App';
import css from '@app/styles.css?raw';
import { LiveApp } from './LiveApp';
import { BrowserFrame, Caption, Cursor, Notification, Wallpaper, pointerAt, type CursorKey } from './Motion';
import { installFetchMock } from './stubs/fetch';
import { BASE_TIME } from './clock';

installFetchMock();

export const T = { click: 62, arrive: 120, end: 180 };
const ago = (min: number) => new Date(BASE_TIME - min * 60_000).toISOString();
const A = { id: 'a', title: 'Design review moved to 3pm', from: 'Ava Chen', at: ago(2) };
const B = { id: 'b', title: 'Invoice #1042 is ready', from: 'Billing', at: ago(14) };
const C = { id: 'c', title: 'Welcome aboard!', from: 'Sam Ortiz', at: ago(55) };
const inbox = (f: number) => (f < T.click + 4 ? [A, B, C] : f < T.arrive ? [B, C] : [A, B, C]);
const handler = (f: number) => (name: string) => (name === 'GET /api/inbox' ? inbox(f) : undefined);

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fw = Math.min(width * 0.82, 980);
  const fh = height * 0.62;
  const fx = (width - fw) / 2;
  const fy = height * 0.08;
  const content = { x: fx, y: fy + 40 };
  const done = { x: fx + fw - 64, y: content.y + 74 + 46 };
  const rest = { x: width * 0.5, y: height * 0.62 };
  const keys: CursorKey[] = [{ f: 0, ...rest }, { f: 24, ...rest }, { f: T.click - 2, ...done }, { f: T.click + 20, ...done }, { f: T.end - 10, ...rest }, { f: T.end, ...rest }];
  const clicks = [T.click];
  return (
    <AbsoluteFill>
      <Wallpaper />
      <BrowserFrame x={fx} y={fy} width={fw} height={fh} url="app.example.com/inbox">
        <LiveApp css={css} handler={handler} overrides=".live-app .spinner { transform: rotate(calc(var(--t) * 360deg)); }" pointer={pointerAt(frame, keys, clicks)}>
          <App />
        </LiveApp>
      </BrowserFrame>
      <Notification toast={{ at: T.arrive - 6, until: T.arrive + 40, title: 'Ava Chen', body: 'Design review moved to 3pm' }} app="Inbox" />
      <Caption text="Inbox zero, one click at a time." />
      <Cursor keys={keys} clicks={clicks} />
    </AbsoluteFill>
  );
};
