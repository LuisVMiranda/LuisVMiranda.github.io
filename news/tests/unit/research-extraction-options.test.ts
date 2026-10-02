import { expect, it } from 'vitest';
import { parseExtractionOptions } from '../../src/modules/research/extraction-options';

it('uses bounded faster defaults for scheduled extraction', () => {
  expect(parseExtractionOptions([])).toEqual({
    maxPerSection: 16,
    concurrency: 12,
  });
});

it('accepts explicit extraction budgets within the supported bounds', () => {
  expect(
    parseExtractionOptions(['--max-per-section', '20', '--concurrency', '8']),
  ).toEqual({ maxPerSection: 20, concurrency: 8 });
});

it.each([
  [['--max-per-section', '0'], /positive integer/],
  [['--concurrency', 'nope'], /positive integer/],
  [['--concurrency', '17'], /cannot exceed 16/],
])('rejects invalid or unsafe CLI budgets: %j', (args, error) => {
  expect(() => parseExtractionOptions(args)).toThrow(error);
});
