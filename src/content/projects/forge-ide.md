---
title: Forge
tagline: >-
  The IDE for Polaron, written in Polaron: editor, navigation, git, build and run, terminals
  and a debugger client, rendered on the GPU.
repo: https://github.com/jvpts11/Forge-IDE
language: Polaron
status: A working native graphical IDE, with over 400 engine self-checks
order: 4
---

Forge is the first flagship application of the language. It is a native, from-scratch IDE built
entirely in Polaron and drawn through the Polaron-OpenGL stack, which is how the language
proves it can carry real, GUI-heavy software rather than command-line programs alone.

## What works today

- **Editing** — multi-cursor with column select, snapshot undo and redo, auto-indent, block
  indent and comment toggle, bracket matching, folding, bookmarks, and find and replace across
  files.
- **Navigation** — go to definition, including into the bundled standard library, find
  references, an outline panel, breadcrumbs, workspace symbol search, quick open and a fuzzy
  command palette.
- **Language intelligence** — Polaron highlighting, autocomplete, hover, and live diagnostics:
  the compiler runs on the unsaved buffer, debounced, so mistakes surface as you type. Quick
  fixes, `polaron explain` and workspace-wide rename come with it.
- **Git** — status with gutter change bars, commit, push, branches, and a diff view in both
  side-by-side and unified form.
- **Terminals** — several integrated terminals, each running its shell behind a real
  pseudo-console, so colours, cursor movement, history and tab completion behave as they do in
  a real console.
- **Debugger** — a Debug Adapter Protocol client with gutter breakpoints, stepping, call stack
  and variables, driving `lldb-dap` over the DWARF that `polaron build --debug` emits.

## How it is built

The editor engine is decoupled from graphics and tested headless, without a window. The
graphics layer is a second view backend over the same controller: a pixel-space quad batcher,
a glyph atlas, a frame composer, and the native window and event loop.

`Forge.exe test` runs the engine self-check, more than four hundred checks, and `polaron build`
compiles the whole of `src/` into one program.
