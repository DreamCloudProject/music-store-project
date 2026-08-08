/** Тема через класс `.dark` / `data-theme` / `color-scheme`. Без LS/SS. */

export type ThemeMode = "light" | "dark";

/** После ручного переключения OS-схема не перетирает до перезагрузки. */
let manualLock = false;

export function getSystemIsDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getResolvedIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function applyTheme(mode?: ThemeMode) {
  const isDark =
    mode === "dark" ? true : mode === "light" ? false : getSystemIsDark();

  if (mode) manualLock = true;

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.documentElement.dataset.theme = mode ?? (isDark ? "dark" : "light");
}

/** Старт / смена OS — только пока не было ручного клика. */
export function syncThemeFromSystem() {
  if (manualLock) return;
  applyTheme();
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getResolvedIsDark() ? "light" : "dark";
  applyTheme(next);
  return next;
}
