/** Taskbar clock. Local time, updated every fifteen seconds. */
const clock = document.getElementById('clock');

function tick(): void {
  if (!clock) return;
  clock.textContent = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

tick();
setInterval(tick, 15_000);
