import { Theme } from "./types";

let currentTheme: Theme = 'light';
let onThemeChange: ((theme: Theme) => void) | null = null;

export function initTheme(callback?: (theme: Theme) => void) {
  if (callback) onThemeChange = callback;

  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) {
    currentTheme = savedTheme;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    currentTheme = 'dark';
  }
  
  applyTheme(currentTheme);
}

export function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  applyTheme(currentTheme);
}

export function getCurrentTheme(): Theme {
    return currentTheme;
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  
  if (onThemeChange) {
      onThemeChange(theme);
  }
}
