/**
 * The media player: a playlist of the owner's favorite songs, artist and
 * title only. It never loads audio, lyrics or album art, so nothing
 * copyrighted is reproduced. The tracks are server rendered; this file reads
 * them from the DOM so the list lives in one place.
 */
const PLAY_GLYPH = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1v10L11 6z" fill="currentColor"></path></svg>';
const PAUSE_GLYPH =
  '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" fill="currentColor"></rect><rect x="7" y="1" width="3" height="10" fill="currentColor"></rect></svg>';

/** How long the progress bar takes to cross, in seconds. It shows motion, not a duration. */
const SWEEP = 240;

const win = document.getElementById('win-media');
const tracks = [...(win?.querySelectorAll<HTMLButtonElement>('.track') ?? [])];
const title = win?.querySelector<HTMLElement>('[data-title]');
const artist = win?.querySelector<HTMLElement>('[data-artist]');
const index = win?.querySelector<HTMLElement>('[data-idx]');
const play = win?.querySelector<HTMLButtonElement>('[data-play]');
const seek = win?.querySelector<HTMLElement>('.seek span');
const time = win?.querySelector<HTMLElement>('.time');

let current = 0;
let elapsed = 0;
let timer: number | undefined;

function isPlaying(): boolean {
  return win?.classList.contains('playing') ?? false;
}

function render(): void {
  if (seek) seek.style.width = `${((elapsed % SWEEP) / SWEEP) * 100}%`;
  if (time) {
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    time.textContent = `${minutes}:${seconds}`;
  }
}

function select(next: number, keepPlaying = isPlaying()): void {
  if (tracks.length === 0) return;
  current = ((next % tracks.length) + tracks.length) % tracks.length;
  elapsed = 0;

  tracks.forEach((track, position) => {
    track.setAttribute('aria-current', String(position === current));
  });

  const track = tracks[current];
  if (title) title.textContent = track?.querySelector('b')?.textContent ?? '';
  if (artist) artist.textContent = track?.querySelector('small')?.textContent ?? '';
  if (index) index.textContent = String(current + 1);

  render();
  setPlaying(keepPlaying);
}

function setPlaying(on: boolean): void {
  win?.classList.toggle('playing', on);
  if (play) {
    play.innerHTML = on ? PAUSE_GLYPH : PLAY_GLYPH;
    play.setAttribute('aria-label', on ? 'Pause' : 'Play');
    play.setAttribute('aria-pressed', String(on));
  }

  clearInterval(timer);
  timer = undefined;
  if (!on) return;

  timer = window.setInterval(() => {
    if (!win?.isConnected) {
      clearInterval(timer);
      return;
    }
    elapsed += 1;
    render();
  }, 1000);
}

tracks.forEach((track, position) => {
  track.addEventListener('click', () => select(position));
  track.addEventListener('dblclick', () => select(position, true));
});

play?.addEventListener('click', () => setPlaying(!isPlaying()));
win?.querySelector('[data-prev]')?.addEventListener('click', () => select(current - 1));
win?.querySelector('[data-next]')?.addEventListener('click', () => select(current + 1));

if (tracks.length > 0) select(0, false);
