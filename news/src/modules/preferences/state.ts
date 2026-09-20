export type Theme = 'light' | 'dark';
export const fontSizes = [16, 18, 20, 22, 24] as const;
const key = 'noticias.preferences.v1';
export interface Preferences {
  theme: Theme;
  fontSize: number;
}
export type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

export function readPreferences(
  storage: StorageAccess | undefined,
  dark: boolean,
): Preferences {
  const fallback: Preferences = {
    theme: dark ? 'dark' : 'light',
    fontSize: 18,
  };
  try {
    const raw = JSON.parse(
      storage?.getItem(key) || '{}',
    ) as Partial<Preferences>;
    return {
      theme:
        raw.theme === 'light' || raw.theme === 'dark'
          ? raw.theme
          : fallback.theme,
      fontSize: fontSizes.includes(raw.fontSize as (typeof fontSizes)[number])
        ? raw.fontSize!
        : 18,
    };
  } catch {
    return fallback;
  }
}

export function writePreferences(
  storage: StorageAccess | undefined,
  value: Preferences,
): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    /* Reading remains available. */
  }
}

export function resizeFont(current: number, delta: number): number {
  return Math.max(16, Math.min(24, current + delta * 2));
}
