// Structural checks supplement the browser behavior tests.
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parsers } from 'prettier/plugins/babel';
import { root } from './verify.mjs';

const functions = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ObjectMethod',
]);
const decisions = new Set([
  'IfStatement',
  'ConditionalExpression',
  'LogicalExpression',
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'WhileStatement',
  'DoWhileStatement',
  'CatchClause',
]);
const controls = new Set([
  'IfStatement',
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'WhileStatement',
  'DoWhileStatement',
  'TryStatement',
  'SwitchStatement',
]);
const results = [],
  lengths = [];

function children(node) {
  return Object.entries(node)
    .filter(([key]) => !['loc', 'tokens', 'comments'].includes(key))
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter((value) => value && typeof value === 'object' && value.type);
}

function metric(node, depth = 0) {
  if (functions.has(node.type)) return { complexity: 0, nesting: 0 };
  const level = depth + Number(controls.has(node.type));
  const descendants = children(node).map((child) => metric(child, level));
  const own =
    Number(decisions.has(node.type)) + Number(node.type === 'SwitchCase' && node.test !== null);
  return {
    complexity: own + descendants.reduce((sum, value) => sum + value.complexity, 0),
    nesting: Math.max(level, ...descendants.map((value) => value.nesting)),
  };
}

function inspect(node, file) {
  if (functions.has(node.type)) {
    const stats = metric(node.body);
    results.push({
      file,
      line: node.loc.start.line,
      complexity: stats.complexity + 1,
      nesting: stats.nesting,
      parameters: node.params.length,
    });
  }
  children(node).forEach((child) => inspect(child, file));
}

async function walk(directory) {
  for (const item of await readdir(resolve(root, directory), { withFileTypes: true })) {
    if (['node_modules', 'artifacts'].includes(item.name)) continue;
    const file = `${directory}/${item.name}`;
    if (item.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!/\.(css|html|js|mjs)$/.test(file)) continue;
    const source = await readFile(resolve(root, file), 'utf8');
    lengths.push({ file, lines: source.split('\n').length });
    if (/\.(js|mjs)$/.test(file)) inspect(parsers.babel.parse(source), file);
  }
}

await walk('.');
const longFiles = lengths.filter((item) => item.lines > 600);
const violations = results.filter(
  (item) => item.complexity > 10 || item.nesting > 3 || item.parameters > 5,
);
console.log(
  JSON.stringify(
    {
      longFiles,
      violations,
      maximumLines: Math.max(...lengths.map((item) => item.lines)),
      functions: results.length,
    },
    null,
    2,
  ),
);
process.exitCode = longFiles.length || violations.length ? 1 : 0;
