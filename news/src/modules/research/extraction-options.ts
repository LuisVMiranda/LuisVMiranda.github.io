export type ExtractionOptions = {
  maxPerSection: number;
  concurrency: number;
};

const DEFAULT_MAX_PER_SECTION = 16;
const DEFAULT_CONCURRENCY = 12;
const MAX_MAX_PER_SECTION = 40;
const MAX_CONCURRENCY = 16;

function optionValue(
  args: string[],
  name: string,
  fallback: number,
  maximum: number,
): number {
  const index = args.indexOf(name);
  if (index < 0) return fallback;

  const raw = args[index + 1];
  const value = Number(raw);
  if (!raw || !Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer`);
  if (value > maximum)
    throw new Error(`${name} cannot exceed ${maximum} for safe extraction`);
  return value;
}

export function parseExtractionOptions(args: string[]): ExtractionOptions {
  return {
    maxPerSection: optionValue(
      args,
      '--max-per-section',
      DEFAULT_MAX_PER_SECTION,
      MAX_MAX_PER_SECTION,
    ),
    concurrency: optionValue(
      args,
      '--concurrency',
      DEFAULT_CONCURRENCY,
      MAX_CONCURRENCY,
    ),
  };
}
