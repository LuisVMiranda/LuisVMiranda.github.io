import { readFile, readdir } from 'node:fs/promises';
import { Linter } from 'eslint';

const linter = new Linter();
function checkScript(name: string, source: string): void {
  for (const [index, block] of [
    ...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
  ].entries()) {
    const messages = linter.verify(block[1] || '', {
      languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      rules: {
        complexity: ['error', 10],
        'max-depth': ['error', 3],
        'max-params': ['error', 5],
      },
    });
    if (messages.length)
      throw new Error(
        `${name} script ${index + 1}: ${messages.map((item) => item.message).join('; ')}`,
      );
  }
}

for (const file of await readdir('static')) {
  if (!file.endsWith('.html')) continue;
  checkScript(file, await readFile(`static/${file}`, 'utf8'));
}
const themeInit = await readFile('src/client/theme-init.js', 'utf8');
const messages = linter.verify(themeInit, {
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    complexity: ['error', 10],
    'max-depth': ['error', 3],
    'max-params': ['error', 5],
  },
});
if (messages.length)
  throw new Error(
    `src/client/theme-init.js: ${messages.map((item) => item.message).join('; ')}`,
  );
console.log(
  'Inline static-page scripts meet complexity, nesting and parameter limits.',
);
