/**
 * The fake shell. Everything runs in the page: no network, no eval, no shell.
 * The markup it drives lives in components/programs/CommandPrompt.astro.
 */
import { isProgramId, type ProgramId } from '../wm-core';
import { openProgram } from '../wm';

const PROMPT = 'C:\\Users\\jvpts11>';

/** Short names the help text advertises, on top of the real program ids. */
const ALIASES: Record<string, ProgramId> = {
  jts: 'js-tech-series',
  'my-computer': 'computer',
  bin: 'recycle-bin',
  trash: 'recycle-bin',
  mail: 'contact',
  email: 'contact',
  music: 'media',
  shell: 'cmd',
};

const HELP = [
  'HELP           Show this list',
  'WHOAMI         Who is using this machine',
  'PROJECTS       List the projects',
  'OPEN <name>    Open a program: polaron, agents, jts, projects,',
  '               computer, media, contact, bin',
  'CLS            Clear the screen',
  '',
].join('\n');

const WHOAMI = ['jvpts11', 'AI engineer. C/C++, C#, Java and Python.', 'Designing Polaron, a systems language.', ''].join(
  '\n',
);

const PROJECTS = [
  '  polaron          Systems language',
  '  agents           LLM-driven civilization sim, written in Polaron',
  '  js-tech-series   NeoForge Minecraft mod',
  '',
].join('\n');

const win = document.getElementById('win-cmd');
const out = win?.querySelector<HTMLElement>('.cmd-out');
const form = win?.querySelector<HTMLFormElement>('.cmd-line');
const input = win?.querySelector<HTMLInputElement>('#cmd-input');
const body = win?.querySelector<HTMLElement>('.wbody');

function print(text: string): void {
  if (out) out.textContent += `${text}\n`;
}

function resolve(name: string): ProgramId | null {
  const key = name.toLowerCase();
  if (isProgramId(key)) return key;
  return ALIASES[key] ?? null;
}

function run(line: string): void {
  const [word, ...args] = line.split(/\s+/);
  const command = (word ?? '').toLowerCase();

  switch (command) {
    case '':
      return;
    case 'help':
      print(HELP);
      return;
    case 'whoami':
      print(WHOAMI);
      return;
    case 'projects':
      print(PROJECTS);
      return;
    case 'cls':
      if (out) out.textContent = '';
      return;
    case 'open': {
      const name = args[0] ?? '';
      if (!name) {
        print('Usage: OPEN <name>\n');
        return;
      }
      const id = resolve(name);
      if (id && openProgram(id)) print(`Opening ${name}...\n`);
      else print(`The system cannot find the program "${name}".\n`);
      return;
    }
    default:
      print(`'${word}' is not recognized as an internal or external command.`);
      print('Type HELP for a list of commands.\n');
  }
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!input) return;

  const line = input.value.trim();
  input.value = '';
  print(`${PROMPT}${line}`);
  run(line);

  if (body) body.scrollTop = body.scrollHeight;
});

// Clicking anywhere in the console puts the caret back where typing happens.
body?.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('a, button')) return;
  input?.focus();
});
