import { describe, expect, it } from 'vitest';
import { getProgram, PROGRAMS } from '../../src/data/programs';
import { PROGRAM_IDS } from '../../src/scripts/wm-core';

describe('program registry', () => {
  it('covers every program id exactly once', () => {
    expect(PROGRAMS.map((p) => p.id).sort()).toEqual([...PROGRAM_IDS].sort());
  });

  it('gives every program a usable window size and labels', () => {
    for (const program of PROGRAMS) {
      expect(program.width).toBeGreaterThan(240);
      expect(program.height).toBeGreaterThan(200);
      expect(program.title.length).toBeGreaterThan(0);
      expect(program.label.length).toBeGreaterThan(0);
      expect(program.icon.startsWith('i-')).toBe(true);
    }
  });

  it('shows every program on the desktop and fills both start menu columns', () => {
    expect(PROGRAMS.every((p) => p.desktop)).toBe(true);
    expect(PROGRAMS.filter((p) => p.menu === 'programs').length).toBeGreaterThan(0);
    expect(PROGRAMS.filter((p) => p.menu === 'places').length).toBeGreaterThan(0);
  });

  it('looks a program up by id', () => {
    expect(getProgram('cmd').title).toBe('Command Prompt');
    expect(getProgram('media').status).toBe('Playlist only, no audio');
  });
});
