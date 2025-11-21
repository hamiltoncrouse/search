const form = document.querySelector('.search-form');
const input = document.getElementById('movie');
const button = form?.querySelector('button');

if (input) {
  window.requestAnimationFrame(() => input.focus());
}

form?.addEventListener('submit', () => {
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Sending to IMDb…';
});
