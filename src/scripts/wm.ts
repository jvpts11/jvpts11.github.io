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
  isProgramId,
  nextZ,
  raise,
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

const MAX_GLYPH =
  '<svg viewBox="0 0 21 21" aria-hidden="true"><rect x="5" y="5" width="11" height="11" fill="none" stroke="#fff"></rect><rect x="5" y="5" width="11" height="3" fill="#fff"></rect></svg>';
const RESTORE_GLYPH =
  '<svg viewBox="0 0 21 21" aria-hidden="true"><rect x="8" y="4" width="9" height="9" fill="none" stroke="#fff"></rect><rect x="8" y="4" width="9" height="2.5" fill="#fff"></rect><rect x="4" y="8" width="9" height="9" fill="#2D6FEA" stroke="#fff"></rect><rect x="4" y="8" width="9" height="2.5" fill="#fff"></rect></svg>';

const open = new Map<ProgramId, OpenWindow>();
let opened = 0;

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

export function openProgram(id: ProgramId, opener: HTMLElement | null = null): boolean {
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
  el.focus();
  return true;
}

function focusWindow(id: ProgramId): void {
  const entry = open.get(id);
  if (!entry) return;

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
  entry.opener?.focus();
  focusTopmost();
}

function toggleMax(id: ProgramId): void {
  const entry = open.get(id);
  if (!entry) return;
  const maximized = !entry.state.maximized;
  entry.state = { ...entry.state, maximized };
  entry.el.classList.toggle('max', maximized);

  const button = entry.el.querySelector<HTMLButtonElement>('.ctl.max');
  if (button) {
    button.innerHTML = maximized ? RESTORE_GLYPH : MAX_GLYPH;
    button.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
  }
}

function startDrag(entry: OpenWindow, event: PointerEvent): void {
  if (event.button !== 0 || entry.state.maximized) return;
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
    selectIcon(icon);
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
