export function getInitialTheme(): 'light' | 'dark' {
  const t = new URLSearchParams(location.search).get('theme');
  return t === 'dark' ? 'dark' : 'light';
}