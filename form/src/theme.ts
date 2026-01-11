export function getInitialTheme() {
  const params = new URLSearchParams(window.location.search);
  return params.get('theme') === 'dark' ? 'dark' : 'light';
}