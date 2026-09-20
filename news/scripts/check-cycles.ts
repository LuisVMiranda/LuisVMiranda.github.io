import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(file) : [file];
    }),
  );
  return groups.flat().filter((file) => /\.(ts|mjs|js)$/.test(file));
}
async function resolveImport(
  from: string,
  specifier: string,
): Promise<string | undefined> {
  const base = path.resolve(path.dirname(from), specifier);
  for (const suffix of ['', '.ts', '.js', '.mjs', '/index.ts']) {
    const candidate = base + suffix;
    const exists = await stat(candidate)
      .then((info) => info.isFile())
      .catch(() => false);
    if (exists) return candidate;
  }
  return undefined;
}
const graph = new Map<string, string[]>();
for (const file of await sourceFiles('src')) {
  const text = await readFile(file, 'utf8');
  const imports = [
    ...text.matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.[^'"]+)['"]/g),
  ].map((match) => match[1]!);
  const dependencies = await Promise.all(
    imports.map((item) => resolveImport(file, item)),
  );
  graph.set(
    path.resolve(file),
    dependencies.filter((item): item is string => Boolean(item)),
  );
}
const visited = new Set<string>();
function visit(file: string, trail: string[]): void {
  if (trail.includes(file))
    throw new Error(
      `Dependency cycle: ${[...trail, file].map((item) => path.relative('.', item)).join(' → ')}`,
    );
  if (visited.has(file)) return;
  for (const dependency of graph.get(file) || [])
    visit(dependency, [...trail, file]);
  visited.add(file);
}
for (const file of graph.keys()) visit(file, []);
console.log(
  `No dependency cycles across ${graph.size} TypeScript and JavaScript modules.`,
);
