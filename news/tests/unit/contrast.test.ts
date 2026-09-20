import { expect, it } from 'vitest';
import { sections } from '../../src/modules/content/sections';
function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => parseInt(part, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
it('all eight text accents meet AA contrast against their reading surfaces', () => {
  for (const section of sections) {
    expect(
      contrast(section.light, '#faf9f5'),
      section.id + ' light',
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(section.dark, '#161b21'),
      section.id + ' dark',
    ).toBeGreaterThanOrEqual(4.5);
  }
});
