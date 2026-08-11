import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dwellpay-theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (_) { /* ignore */ }
  // Respect OS preference as fallback
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* ignore */ }
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle, isDark: theme === 'dark' };
}
