/**
 * DOM layer of the window manager. Every geometry and z-index decision comes
 * from wm-core; this file only binds it to the page: pointer events, the
 * taskbar, the window controls and the launchers.
 *
 * Windows are already in the HTML, one hidden <section class="win"> per
 * program, so this never builds markup.
 */
import { getProgram, type Program } from '../data/programs';
import {
  cascadePosition,
  clampPosition,
  deserialize,
  isProgramId,
  isSavedPayload,
  nextZ,
  parseOpenParam,
  raise,
  serialize,
  STORAGE_KEY,
  type Bounds,
  type ProgramId,
  type WindowState,
} from './wm-core';

interface OpenWindow {
  state: WindowState;
  el: HTMLElement;
  task: HTMLButtonElement;
  program: Program;
  /** Element to return focus to when the window closes. */
  opener: HTMLElement | null;
}

const layer = document.getElementById('windows');
const taskbar = document.getElementById('tasks');

/** Below this width the desktop behaves like a phone: fullscreen, one at a time. */
const phone = window.matchMedia('(max-width: 767px)');

const MAX_GLYPH =
  '<svg viewBox="0 0 21 21" aria-hidden="true"><rect x="5" y="5" width="11" height="11" fill="none" stroke="#fff"></rect><rect x="5" y="5" width="11" height="3" fill="#fff"></rect></svg>';
const RESTORE_GLYPH =
  '<svg viewBox="0 0 21 21" aria-hidden="true"><rect x="8" y="4" width="9" height="9" fill="none" stroke="#fff"></rect><rect x="8" y="4" width="9" height="2.5" fill="#fff"></rect><rect x="4" y="8" width="9" height="9" fill="#2D6FEA" stroke="#fff"></rect><rect x="4" y="8" width="9" height="2.5" fill="#fff"></rect></svg>';

const open = new Map<ProgramId, OpenWindow>();
let opened = 0;

/**
 * Writes the desktop to storage after every discrete change. Never throws:
 * in private mode or with storage blocked the desktop still works, it just
 * forgets between visits.
 */
function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(states()));
  } catch {
    // Storage is unavailable. Nothing to do; the session stays in memory.
  }
}

function bounds(): Bounds {
  return { width: layer?.clientWidth ?? 0, height: layer?.clientHeight ?? 0 };
}

function states(): WindowState[] {
  return [...open.values()].map((entry) => entry.state);
}

function windowEl(id: ProgramId): HTMLElement | null {
  return document.getElementById(`win-${id}`);
}

function apply(entry: OpenWindow): void {
  const { state, el } = entry;
  el.style.left = `${state.x}px`;
  el.style.top = `${state.y}px`;
  el.style.width = `${state.w}px`;
  el.style.height = `${state.h}px`;
  el.style.zIndex = String(state.z);
  el.hidden = state.minimized;
}

function makeTaskButton(program: Program): HTMLButtonElement {
  const task = document.createElement('button');
  task.type = 'button';
  task.className = 'task';
  task.dataset.program = program.id;
  task.setAttribute('aria-pressed', 'false');
  // The strip is a toolbar: one tab stop for all of it, arrows move inside.
  task.tabIndex = -1;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${program.icon}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.append(use);

  const label = document.createElement('span');
  label.textContent = program.title;

  task.append(svg, label);
  task.addEventListener('click', () => {
    const entry = open.get(program.id);
    if (!entry) return;
    if (entry.state.minimized) restore(program.id);
    else if (entry.el.classList.contains('active')) minimize(program.id);
    else focusWindow(program.id);
  });
  return task;
}

export function openProgram(
  id: ProgramId,
  opener: HTMLElement | null = null,
  focusEl = true,
): boolean {
  const el = windowEl(id);
  if (!layer || !taskbar || !el) return false;

  const existing = open.get(id);
  if (existing) {
    if (existing.state.minimized) restore(id);
    else focusWindow(id);
    return true;
  }

  const program = getProgram(id);
  const area = bounds();
  const size = {
    w: Math.min(program.width, Math.max(240, area.width - 12)),
    h: Math.min(program.height, Math.max(200, area.height - 12)),
  };
  const position = cascadePosition(opened, size, area);
  opened += 1;

  const state: WindowState = {
    id,
    x: position.x,
    y: position.y,
    w: size.w,
    h: size.h,
    z: nextZ(states()),
    minimized: false,
    maximized: false,
  };

  const task = makeTaskButton(program);
  taskbar.append(task);

  const entry: OpenWindow = { state, el, task, program, opener };
  open.set(id, entry);
  apply(entry);
  focusWindow(id);
  if (focusEl) el.focus();
  return true;
}

function focusWindow(id: ProgramId): void {
  const entry = open.get(id);
  if (!entry) return;

  // One window at a time on a phone: whatever was open steps aside into the
  // taskbar instead of stacking behind.
  if (phone.matches) {
    for (const other of open.values()) {
      if (other.state.id === id || other.state.minimized) continue;
      other.state = { ...other.state, minimized: true };
      other.el.classList.remove('active');
      other.task.classList.remove('active');
      other.task.setAttribute('aria-pressed', 'false');
      apply(other);
    }
  }

  const raised = raise(states(), id);
  for (const state of raised) {
    const target = open.get(state.id);
    if (!target) continue;
    target.state = state;
    const isActive = state.id === id && !state.minimized;
    target.el.classList.toggle('active', isActive);
    target.task.classList.toggle('active', isActive);
    target.task.setAttribute('aria-pressed', String(isActive));
    apply(target);
  }
  syncTaskStops();
  save();
}

function focusTopmost(): void {
  let best: OpenWindow | null = null;
  for (const entry of open.values()) {
    if (entry.state.minimized) continue;
    if (!best || entry.state.z > best.state.z) best = entry;
  }
  if (best) focusWindow(best.state.id);
}

function minimize(id: ProgramId): void {
  const entry = open.get(id);
  if (!entry) return;
  entry.state = { ...entry.state, minimized: true };
  entry.el.classList.remove('active');
  entry.task.classList.remove('active');
  entry.task.setAttribute('aria-pressed', 'false');
  apply(entry);
  syncTaskStops();
  save();
  focusTopmost();
}

function restore(id: ProgramId): void {
  const entry = open.get(id);
  if (!entry) return;
  entry.state = { ...entry.state, minimized: false };
  apply(entry);
  focusWindow(id);
  entry.el.focus();
}

function close(id: ProgramId): void {
  const entry = open.get(id);
  if (!entry) return;
  entry.el.hidden = true;
  entry.el.classList.remove('active', 'max');
  entry.task.remove();
  open.delete(id);
  syncTaskStops();
  save();
  entry.opener?.focus();
  focusTopmost();
}

/** Closes every open window. Used by Log Off in the start menu. */
export function closeAll(): void {
  for (const id of [...open.keys()]) close(id);
}

function setMaximized(id: ProgramId, maximized: boolean): void {
  const entry = open.get(id);
  if (!entry) return;
  entry.state = { ...entry.state, maximized };
  entry.el.classList.toggle('max', maximized);

  const button = entry.el.querySelector<HTMLButtonElement>('.ctl.max');
  if (button) {
    button.innerHTML = maximized ? RESTORE_GLYPH : MAX_GLYPH;
    button.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
  }
  save();
}

function toggleMax(id: ProgramId): void {
  const entry = open.get(id);
  if (entry) setMaximized(id, !entry.state.maximized);
}

function startDrag(entry: OpenWindow, event: PointerEvent): void {
  if (event.button !== 0 || entry.state.maximized || phone.matches) return;
  const bar = event.currentTarget as HTMLElement;
  const offsetX = event.clientX - entry.el.offsetLeft;
  const offsetY = event.clientY - entry.el.offsetTop;
  bar.setPointerCapture(event.pointerId);

  const move = (moveEvent: PointerEvent) => {
    const position = clampPosition(
      { x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY },
      { w: entry.el.offsetWidth, h: entry.el.offsetHeight },
      bounds(),
    );
    entry.state = { ...entry.state, ...position };
    apply(entry);
  };
  const stop = () => {
    save();
    bar.removeEventListener('pointermove', move);
    bar.removeEventListener('pointerup', stop);
    bar.removeEventListener('pointercancel', stop);
  };

  bar.addEventListener('pointermove', move);
  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);
}

function wire(el: HTMLElement, id: ProgramId): void {
  el.tabIndex = -1;
  el.addEventListener(
    'pointerdown',
    () => {
      const entry = open.get(id);
      if (entry && !entry.el.classList.contains('active')) focusWindow(id);
    },
    true,
  );

  el.querySelector('.ctl.min')?.addEventListener('click', () => minimize(id));
  el.querySelector('.ctl.max')?.addEventListener('click', () => toggleMax(id));
  el.querySelector('.ctl.close')?.addEventListener('click', () => close(id));

  const bar = el.querySelector<HTMLElement>('.titlebar');
  if (!bar) return;
  bar.addEventListener('dblclick', (event) => {
    if (!(event.target as HTMLElement).closest('button')) toggleMax(id);
  });
  bar.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const entry = open.get(id);
    if (entry) startDrag(entry, event);
  });
}

/** Fills the Details panel of the explorer when a tile is selected. */
function selectTile(tile: HTMLElement): void {
  const list = tile.closest('ul');
  list?.querySelectorAll('.selected').forEach((node) => node.classList.remove('selected'));
  tile.classList.add('selected');

  const details = tile.closest('.win')?.querySelector<HTMLElement>('[data-details]');
  if (!details || !tile.dataset.name) return;
  details.replaceChildren();

  const name = document.createElement('strong');
  name.textContent = tile.dataset.name;
  const description = document.createElement('span');
  description.textContent = tile.dataset.desc ?? '';
  const status = document.createElement('span');
  status.className = 'todo';
  status.textContent = 'Status: TODO(jvpts11)';

  details.append(name, description, status);

  // Every project also has a page that stands on its own.
  if (tile.dataset.page) {
    const link = document.createElement('a');
    link.href = tile.dataset.page;
    link.textContent = 'Open the project page';
    details.append(link);
  }
}

function selectIcon(icon: HTMLElement): void {
  document.querySelectorAll('.icons .selected').forEach((node) => node.classList.remove('selected'));
  icon.classList.add('selected');
}

function activateTab(tab: HTMLElement): void {
  const group = tab.closest('.dlg');
  if (!group) return;
  group.querySelectorAll<HTMLElement>('[role="tab"]').forEach((candidate) => {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
    const panelId = candidate.getAttribute('aria-controls');
    const panel = panelId ? group.querySelector<HTMLElement>(`#${panelId}`) : null;
    if (panel) panel.hidden = !selected;
  });
}

function programFrom(element: HTMLElement | null): ProgramId | null {
  const value = element?.dataset.program ?? element?.dataset.launch;
  return isProgramId(value) ? value : null;
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  const icon = target.closest<HTMLElement>('a.icon[data-program]');
  if (icon) {
    event.preventDefault();
    // A phone has no double-click: one tap opens.
    const id = phone.matches ? programFrom(icon) : null;
    if (id) openProgram(id, icon);
    else selectIcon(icon);
    return;
  }

  const launcher = target.closest<HTMLElement>('[data-launch]');
  if (launcher) {
    const id = programFrom(launcher);
    if (id) openProgram(id, launcher);
    return;
  }

  const closer = target.closest<HTMLElement>('[data-close]');
  if (closer) {
    const win = closer.closest<HTMLElement>('.win');
    const id = programFrom(win);
    if (id) close(id);
    return;
  }

  const tile = target.closest<HTMLElement>('.tile[data-program]');
  if (tile) {
    selectTile(tile);
    return;
  }

  const tab = target.closest<HTMLElement>('[role="tab"]');
  if (tab) activateTab(tab);
});

document.addEventListener('dblclick', (event) => {
  const target = event.target as HTMLElement;
  const launcher = target.closest<HTMLElement>('a.icon[data-program], .tile[data-program]');
  const id = programFrom(launcher);
  if (id) {
    event.preventDefault();
    openProgram(id, launcher);
  }
});

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const launcher = target.closest<HTMLElement>('a.icon[data-program], .tile[data-program]');
  if (launcher && (event.key === 'Enter' || event.key === ' ')) {
    const id = programFrom(launcher);
    if (id) {
      event.preventDefault();
      openProgram(id, launcher);
    }
    return;
  }

  const tab = target.closest<HTMLElement>('[role="tab"]');
  if (tab && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    const tabs = [...(tab.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
    if (next) {
      event.preventDefault();
      activateTab(next);
      next.focus();
    }
  }
});

for (const el of document.querySelectorAll<HTMLElement>('section.win[data-program]')) {
  const id = programFrom(el);
  if (id) wire(el, id);
}

/** Puts a window back where the visitor left it, re-clamped to this viewport. */
function hydrate(state: WindowState): void {
  const el = windowEl(state.id);
  if (!layer || !taskbar || !el || open.has(state.id)) return;

  const program = getProgram(state.id);
  const area = bounds();
  const size = {
    w: Math.min(state.w, Math.max(240, area.width - 12)),
    h: Math.min(state.h, Math.max(200, area.height - 12)),
  };
  const position = clampPosition({ x: state.x, y: state.y }, size, area);

  const task = makeTaskButton(program);
  taskbar.append(task);

  const entry: OpenWindow = {
    state: { ...state, ...size, ...position, maximized: false },
    el,
    task,
    program,
    opener: null,
  };
  open.set(state.id, entry);
  opened += 1;
  apply(entry);
  if (state.maximized) setMaximized(state.id, true);
}

function boot(): void {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: treat this as a first visit.
  }

  // Oldest first, so the saved z-order survives the rebuild.
  for (const state of [...deserialize(raw)].sort((a, b) => a.z - b.z)) hydrate(state);
  focusTopmost();

  // Neither path steals keyboard focus: on arrival the first Tab should reach
  // the desktop icons, not the inside of a window nobody asked to open.
  const deepLink = parseOpenParam(location.search);
  if (deepLink) {
    // The URL wins over whatever was saved, and the address is left alone.
    openProgram(deepLink, null, false);
  } else if (!isSavedPayload(raw) && !phone.matches) {
    // First visit, or a payload we cannot trust: never show an empty desktop.
    // Not on a phone, though: a window there covers the whole screen and would
    // hide the icons the visitor arrived to see.
    openProgram('computer', null, false);
  }
}

function taskButtons(): HTMLButtonElement[] {
  return [...(taskbar?.querySelectorAll<HTMLButtonElement>('.task') ?? [])];
}

/**
 * Roving tabindex for the taskbar. As a toolbar it holds a single tab stop,
 * the active window's button, and the arrow keys move between the others.
 */
function syncTaskStops(): void {
  const buttons = taskButtons();
  if (buttons.length === 0) return;
  const active = buttons.find((button) => button.classList.contains('active')) ?? buttons[0];
  for (const button of buttons) button.tabIndex = button === active ? 0 : -1;
}

taskbar?.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

  const buttons = taskButtons();
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;

  const step = event.key === 'ArrowRight' ? 1 : -1;
  const current = buttons[index];
  const next = buttons[(index + step + buttons.length) % buttons.length];
  if (!current || !next) return;

  event.preventDefault();
  current.tabIndex = -1;
  next.tabIndex = 0;
  next.focus();
});

// A reload or a closing tab must not lose the last change.
window.addEventListener('pagehide', save);

boot();
