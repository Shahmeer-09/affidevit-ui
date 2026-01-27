import { useEffect, useState } from 'react';

type Theme = 'light';

export function useTheme() {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const setTheme = (_newTheme: Theme) => {
    // Light theme only - no-op
  };

  return { theme, setTheme };
}
