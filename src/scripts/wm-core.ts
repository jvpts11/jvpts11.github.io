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

export const STORAGE_KEY = 'jvpts11-os:v1';
export const SCHEMA_VERSION = 1;

export function isProgramId(value: unknown): value is ProgramId {
  return typeof value === 'string' && (PROGRAM_IDS as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFinitePositive(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

/** Turns one stored entry into a WindowState, or rejects it. Storage is never trusted. */
function toWindowState(value: unknown): WindowState | null {
  if (typeof value !== 'object' || value === null) return null;
  const w = value as Record<string, unknown>;
  if (!isProgramId(w.id)) return null;
  if (!isFiniteNumber(w.x) || !isFiniteNumber(w.y) || !isFiniteNumber(w.z)) return null;
  if (!isFinitePositive(w.w) || !isFinitePositive(w.h)) return null;
  if (typeof w.minimized !== 'boolean' || typeof w.maximized !== 'boolean') return null;
  return {
    id: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    z: w.z,
    minimized: w.minimized,
    maximized: w.maximized,
  };
}

export function serialize(states: WindowState[]): string {
  return JSON.stringify({ v: SCHEMA_VERSION, windows: states });
}

/** Reads stored state defensively: anything unusable yields an empty desktop instead of throwing. */
export function deserialize(raw: string | null): WindowState[] {
  if (!raw) return [];

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return [];
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return [];

  const { v, windows } = payload as { v?: unknown; windows?: unknown };
  if (v !== SCHEMA_VERSION || !Array.isArray(windows)) return [];

  const seen = new Set<ProgramId>();
  const result: WindowState[] = [];
  for (const entry of windows) {
    const state = toWindowState(entry);
    if (!state || seen.has(state.id)) continue;
    seen.add(state.id);
    result.push(state);
  }
  return result;
}

/** Reads the `?open=<id>` deep link, accepting only known programs. */
export function parseOpenParam(search: string): ProgramId | null {
  const value = new URLSearchParams(search).get('open');
  return isProgramId(value) ? value : null;
}
