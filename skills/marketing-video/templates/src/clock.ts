// Frame-pinned time. Every render of frame N sees the same "now", so relative timestamps
// ("updated 4s ago"), countdowns and date headers are identical on every machine and every re-render.
export const BASE_TIME = Date.UTC(2026, 0, 15, 17, 41, 0); // pick a flattering, fixed moment

const RealDate = Date;
let current = BASE_TIME;
let installed = false;

export const frameTime = (frame: number, fps: number) => BASE_TIME + Math.round((frame * 1000) / fps);

export function setClock(frame: number, fps: number) {
  current = frameTime(frame, fps);
  if (installed) return;
  installed = true;
  // Covers Date.now() and `new Date()` with no arguments; explicit dates pass through untouched.
  class FrameDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(current);
      else super(...(args as [string | number | Date]));
    }
    static now() {
      return current;
    }
  }
  globalThis.Date = FrameDate as DateConstructor;
}

export const realNow = () => RealDate.now();
