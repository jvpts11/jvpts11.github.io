/**
 * Start menu, log off, turn off and the welcome balloon.
 * Launching a program is handled by wm.ts through the [data-launch] hook;
 * this file only owns the menu itself.
 */
import { closeAll } from './wm';

const startBtn = document.getElementById('startbtn');
const menu = document.getElementById('startmenu');
const shutdown = document.getElementById('shutdown');
const balloon = document.getElementById('balloon');

function entries(): HTMLElement[] {
  return [...(menu?.querySelectorAll<HTMLElement>('.sm-item') ?? [])];
}

function isOpen(): boolean {
  return menu !== null && !menu.hidden;
}

function closeMenu(focusButton = false): void {
  if (!menu || !startBtn) return;
  menu.hidden = true;
  startBtn.setAttribute('aria-expanded', 'false');
  if (focusButton) startBtn.focus();
}

function openMenu(): void {
  if (!menu || !startBtn) return;
  menu.hidden = false;
  startBtn.setAttribute('aria-expanded', 'true');
  entries()[0]?.focus();
}

startBtn?.addEventListener('click', () => {
  if (isOpen()) closeMenu();
  else openMenu();
});

// Any click that lands outside the menu and outside the start button closes it.
document.addEventListener('click', (event) => {
  if (!isOpen()) return;
  const target = event.target as HTMLElement;
  if (target.closest('#startmenu, #startbtn')) return;
  closeMenu();
});

// Launching from the menu closes it; wm.ts opens the window.
menu?.addEventListener('click', (event) => {
  const item = (event.target as HTMLElement).closest<HTMLElement>('.sm-item[data-launch]');
  if (item) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (!isOpen()) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu(true);
    return;
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const items = entries();
  if (items.length === 0) return;

  event.preventDefault();
  const current = items.indexOf(document.activeElement as HTMLElement);
  const step = event.key === 'ArrowDown' ? 1 : -1;
  const next = current === -1 ? 0 : (current + step + items.length) % items.length;
  items[next]?.focus();
});

document.getElementById('logoff')?.addEventListener('click', () => {
  closeAll();
  closeMenu(true);
});

document.getElementById('turnoff')?.addEventListener('click', () => {
  closeMenu();
  if (!shutdown) return;
  shutdown.hidden = false;
  document.getElementById('restart')?.focus();
});

document.getElementById('restart')?.addEventListener('click', () => {
  if (shutdown) shutdown.hidden = true;
  startBtn?.focus();
});

document.getElementById('balloon-x')?.addEventListener('click', () => {
  if (balloon) balloon.hidden = true;
});
