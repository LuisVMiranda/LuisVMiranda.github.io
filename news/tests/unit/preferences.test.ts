import { expect, it } from 'vitest';
import {
  readPreferences,
  resizeFont,
  writePreferences,
} from '../../src/modules/preferences/state';
it('uses system theme and safe font defaults when storage fails', () => {
  const broken = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  expect(readPreferences(broken, true)).toEqual({
    theme: 'dark',
    fontSize: 18,
  });
  expect(() =>
    writePreferences(broken, { theme: 'light', fontSize: 20 }),
  ).not.toThrow();
});
it('validates saved values and enforces font bounds', () => {
  const saved = {
    getItem: () => '{"theme":"light","fontSize":99}',
    setItem() {},
  };
  expect(readPreferences(saved, true)).toEqual({
    theme: 'light',
    fontSize: 18,
  });
  expect(resizeFont(24, 1)).toBe(24);
  expect(resizeFont(16, -1)).toBe(16);
  expect(resizeFont(18, 1)).toBe(20);
});
