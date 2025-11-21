const form = document.querySelector('.search-form');
const input = document.getElementById('movie');
const button = form?.querySelector('button[type="submit"]');

if (input) {
  window.requestAnimationFrame(() => input.focus());
}

form?.addEventListener('submit', () => {
  if (!button) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.innerHTML = '<span class="sr-only">Sending to IMDb…</span>';
});
