/**
 * Pure window-manager logic: no DOM, no storage access, no side effects.
 * The DOM layer in `wm.ts` binds this to the page, which keeps every rule
 * here testable in isolation.
 */

export const PROGRAM_IDS = [
  'computer',
  'projects',
  'polaron',
  'agents',
  'js-tech-series',
  'cmd',
  'media',
  'contact',
  'recycle-bin',
] as const;

export type ProgramId = (typeof PROGRAM_IDS)[number];

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface WindowState extends Point, Size {
  id: ProgramId;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

export const CASCADE_ORIGIN: Point = { x: 110, y: 24 };
export const CASCADE_STEP = 26;
export const CASCADE_SLOTS = 8;

/** Keeps a window fully inside the desktop, falling back to the origin when it does not fit. */
export function clampPosition(p: Point, size: Size, bounds: Bounds): Point {
  const maxX = Math.max(0, bounds.width - size.w);
  const maxY = Math.max(0, bounds.height - size.h);
  return {
    x: Math.min(Math.max(p.x, 0), maxX),
    y: Math.min(Math.max(p.y, 0), maxY),
  };
}

/** Offsets each new window down and to the right, wrapping after CASCADE_SLOTS windows. */
export function cascadePosition(index: number, size: Size, bounds: Bounds): Point {
  const slot = ((index % CASCADE_SLOTS) + CASCADE_SLOTS) % CASCADE_SLOTS;
  return clampPosition(
    {
      x: CASCADE_ORIGIN.x + slot * CASCADE_STEP,
      y: CASCADE_ORIGIN.y + slot * CASCADE_STEP,
    },
    size,
    bounds,
  );
}

/** The z-index a window needs to sit above every other one. */
export function nextZ(states: Iterable<WindowState>): number {
  let max = 0;
  for (const state of states) {
    if (state.z > max) max = state.z;
  }
  return max + 1;
}

/** Moves a single window to the top, leaving the others and the array order untouched. */
export function raise(states: WindowState[], id: ProgramId): WindowState[] {
  const top = nextZ(states);
  return states.map((state) => (state.id === id ? { ...state, z: top } : state));
}
