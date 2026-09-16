import type { ProgramId } from '../scripts/wm-core';

/**
 * Single source of truth for the programs on the desktop. Icons, start menu
 * entries and window shells are all generated from this list, so adding a
 * program means editing one file.
 */
export interface Program {
  id: ProgramId;
  /** Window title bar. */
  title: string;
  /** Desktop icon and start menu label. */
  label: string;
  /** Symbol id in the icon sprite. */
  icon: string;
  width: number;
  height: number;
  /** Status bar text, when the window has one. */
  status?: string;
  desktop: boolean;
  menu: 'programs' | 'places' | null;
  /** Small line under the label in the start menu. */
  hint?: string;
}

export const PROGRAMS: readonly Program[] = [
  {
    id: 'computer',
    title: 'System Properties',
    label: 'My Computer',
    icon: 'i-computer',
    width: 420,
    height: 440,
    desktop: true,
    menu: 'places',
  },
  {
    id: 'projects',
    title: 'My Projects',
    label: 'My Projects',
    icon: 'i-folder',
    width: 660,
    height: 430,
    // The status bar counts the content collection, so the page passes it in.
    desktop: true,
    menu: 'programs',
    hint: 'Everything jvpts11 builds',
  },
  {
    id: 'polaron',
    title: 'Polaron.exe',
    label: 'Polaron.exe',
    icon: 'i-polaron',
    width: 540,
    height: 400,
    desktop: true,
    menu: 'programs',
    hint: 'Systems language',
  },
  {
    id: 'agents',
    title: 'agents.exe',
    label: 'agents.exe',
    icon: 'i-agents',
    width: 520,
    height: 360,
    desktop: true,
    menu: 'programs',
    hint: 'Civilization sim',
  },
  {
    id: 'js-tech-series',
    title: 'js-tech-series',
    label: 'js-tech-series',
    icon: 'i-jts',
    width: 520,
    height: 360,
    desktop: true,
    menu: 'programs',
    hint: 'NeoForge mod',
  },
  {
    id: 'cmd',
    title: 'Command Prompt',
    label: 'Command Prompt',
    icon: 'i-cmd',
    width: 600,
    height: 340,
    desktop: true,
    menu: 'programs',
  },
  {
    id: 'media',
    title: 'Media Player',
    label: 'Media Player',
    icon: 'i-media',
    width: 620,
    height: 390,
    status: 'Playlist only, no audio',
    desktop: true,
    menu: 'programs',
    hint: 'Favorite songs',
  },
  {
    id: 'contact',
    title: 'New Message',
    label: 'Contact',
    icon: 'i-mail',
    width: 520,
    height: 380,
    desktop: true,
    menu: 'places',
  },
  {
    id: 'recycle-bin',
    title: 'Recycle Bin',
    label: 'Recycle Bin',
    icon: 'i-bin',
    width: 480,
    height: 300,
    status: '0 objects',
    desktop: true,
    menu: 'places',
  },
];

const BY_ID = new Map<ProgramId, Program>(PROGRAMS.map((program) => [program.id, program]));

export function getProgram(id: ProgramId): Program {
  const program = BY_ID.get(id);
  if (!program) throw new Error(`Unknown program: ${id}`);
  return program;
}
