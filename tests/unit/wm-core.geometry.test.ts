import { describe, expect, it } from 'vitest';
import {
  cascadePosition,
  clampPosition,
  nextZ,
  raise,
  type WindowState,
} from '../../src/scripts/wm-core';

const BOUNDS = { width: 1000, height: 700 };
const SIZE = { w: 400, h: 300 };

function win(id: WindowState['id'], z: number): WindowState {
  return { id, x: 0, y: 0, w: 400, h: 300, z, minimized: false, maximized: false };
}

describe('clampPosition', () => {
  it('keeps a window inside every edge', () => {
    expect(clampPosition({ x: -80, y: -40 }, SIZE, BOUNDS)).toEqual({ x: 0, y: 0 });
    expect(clampPosition({ x: 5000, y: 5000 }, SIZE, BOUNDS)).toEqual({ x: 600, y: 400 });
  });

  it('leaves a position that already fits untouched', () => {
    expect(clampPosition({ x: 120, y: 90 }, SIZE, BOUNDS)).toEqual({ x: 120, y: 90 });
  });

  it('returns the origin when the window is larger than the viewport', () => {
    expect(clampPosition({ x: 40, y: 40 }, { w: 1200, h: 900 }, BOUNDS)).toEqual({ x: 0, y: 0 });
  });
});

describe('cascadePosition', () => {
  it('steps each window down and to the right, clearing the icon columns', () => {
    expect(cascadePosition(0, SIZE, BOUNDS)).toEqual({ x: 200, y: 24 });
    expect(cascadePosition(1, SIZE, BOUNDS)).toEqual({ x: 226, y: 50 });
  });

  it('wraps back to the first slot after eight windows', () => {
    expect(cascadePosition(8, SIZE, BOUNDS)).toEqual(cascadePosition(0, SIZE, BOUNDS));
  });

  it('never places a window outside the viewport', () => {
    const tight = { width: 420, height: 320 };
    const pos = cascadePosition(7, SIZE, tight);
    expect(pos.x).toBeLessThanOrEqual(tight.width - SIZE.w);
    expect(pos.y).toBeLessThanOrEqual(tight.height - SIZE.h);
  });
});

describe('nextZ', () => {
  it('returns 1 for an empty desktop', () => {
    expect(nextZ([])).toBe(1);
  });

  it('returns the highest z plus one', () => {
    expect(nextZ([win('cmd', 3), win('media', 7), win('contact', 5)])).toBe(8);
  });
});

describe('raise', () => {
  it('moves only the target to the top', () => {
    const states = [win('cmd', 1), win('media', 2), win('contact', 3)];
    const raised = raise(states, 'cmd');
    expect(raised.find((s) => s.id === 'cmd')?.z).toBe(4);
    expect(raised.find((s) => s.id === 'media')?.z).toBe(2);
    expect(raised.find((s) => s.id === 'contact')?.z).toBe(3);
  });

  it('keeps the array order stable', () => {
    const states = [win('cmd', 1), win('media', 2)];
    expect(raise(states, 'media').map((s) => s.id)).toEqual(['cmd', 'media']);
  });
});
