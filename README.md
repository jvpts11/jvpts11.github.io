# jvpts11.github.io

Personal portfolio of **jvpts11**, built as a desktop you can click through: icons, draggable
windows, a taskbar and a start menu. Every section of the portfolio is a program you open.

Live at <https://jvpts11.github.io>.

## Stack

- [Astro](https://astro.build) 7, static output, no adapter.
- TypeScript in strict mode.
- Vanilla CSS. Every color, font, size and gradient is a custom property in
  `src/styles/tokens.css`; nothing outside that file hardcodes a visual value.
- Plain TypeScript for the interactive parts. No UI framework, no external fonts, no
  analytics, no trackers.
- Original artwork only: the wallpaper is drawn in CSS and the icons are SVG made for this
  project.

## Commands

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # astro check && astro build, must pass with zero warnings
npm run preview
npm test             # unit tests for the window manager logic (Vitest)
npm run test:e2e     # browser tests (Playwright)
npm run preview:stop # stops the preview server that test:e2e starts
```

`npm run test:e2e` starts the preview server with `astro preview --background` before running
the browser tests, because Astro detaches the preview server when it runs without a terminal.

## Layout

```
src/
  data/programs.ts     # single source of truth for the programs
  layouts/             # the desktop shell
  components/          # window chrome, taskbar, start menu, one file per program
  scripts/
    wm-core.ts         # pure window manager logic: geometry, z-order, persistence
    wm.ts              # binds wm-core to the DOM
  styles/              # tokens.css, xp.css, desktop.css
```

## Behavior

- Windows drag, focus, minimize, maximize and close, and where you left them is remembered in
  `localStorage`.
- `/?open=<program>` opens a program directly, for example
  [`/?open=polaron`](https://jvpts11.github.io/?open=polaron).
- Below 768px windows open fullscreen, one at a time.
- Without JavaScript the page becomes a plain stacked document with every program readable and
  every link working.

## Deploy

GitHub Actions builds and publishes to GitHub Pages on every push to `main`
(`.github/workflows/deploy.yml`).
