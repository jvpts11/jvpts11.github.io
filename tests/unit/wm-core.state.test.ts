import { describe, expect, it } from 'vitest';
import {
  deserialize,
  isProgramId,
  parseOpenParam,
  serialize,
  STORAGE_KEY,
  type WindowState,
} from '../../src/scripts/wm-core';

const state: WindowState = {
  id: 'polaron',
  x: 120,
  y: 40,
  w: 540,
  h: 400,
  z: 3,
  minimized: false,
  maximized: true,
};

/** Builds a deliberately malformed entry; typed loosely so TypeScript lets the bad values through. */
function bad(overrides: Record<string, unknown>): Record<string, unknown> {
  return { ...state, ...overrides };
}

describe('serialize and deserialize', () => {
  it('round-trips a full state', () => {
    expect(deserialize(serialize([state]))).toEqual([state]);
  });

  it('uses a versioned payload', () => {
    expect(JSON.parse(serialize([state]))).toEqual({ v: 1, windows: [state] });
    expect(STORAGE_KEY).toBe('jvpts11-os:v1');
  });

  it('returns an empty list for anything unusable', () => {
    expect(deserialize(null)).toEqual([]);
    expect(deserialize('')).toEqual([]);
    expect(deserialize('{not json')).toEqual([]);
    expect(deserialize(JSON.stringify({ v: 99, windows: [state] }))).toEqual([]);
    expect(deserialize(JSON.stringify({ v: 1, windows: 'nope' }))).toEqual([]);
    expect(deserialize(JSON.stringify(['just', 'an', 'array']))).toEqual([]);
  });

  it('drops entries that are not usable windows', () => {
    const payload = JSON.stringify({
      v: 1,
      windows: [
        state,
        bad({ id: 'solitaire' }),
        bad({ id: 'cmd', x: Number.NaN }),
        bad({ id: 'media', w: 0 }),
        bad({ id: 'contact', minimized: 'yes' }),
        null,
      ],
    });
    expect(deserialize(payload)).toEqual([state]);
  });

  it('keeps only the first entry per program', () => {
    const payload = JSON.stringify({ v: 1, windows: [state, { ...state, z: 9 }] });
    expect(deserialize(payload)).toEqual([state]);
  });
});

describe('parseOpenParam', () => {
  it('accepts every known program id', () => {
    expect(parseOpenParam('?open=polaron')).toBe('polaron');
    expect(parseOpenParam('?open=js-tech-series')).toBe('js-tech-series');
  });

  it('rejects anything else', () => {
    expect(parseOpenParam('')).toBeNull();
    expect(parseOpenParam('?open=')).toBeNull();
    expect(parseOpenParam('?open=solitaire')).toBeNull();
    expect(parseOpenParam('?other=polaron')).toBeNull();
  });
});

describe('isProgramId', () => {
  it('narrows only known ids', () => {
    expect(isProgramId('cmd')).toBe(true);
    expect(isProgramId('nope')).toBe(false);
    expect(isProgramId(null)).toBe(false);
  });
});
