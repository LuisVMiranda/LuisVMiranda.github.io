import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export async function testAccessibility(page, check) {
  await check('Desktop and mobile WCAG A/AA automated accessibility checks', async () => {
    await page.addScriptTag({
      path: process.env.AXE_CORE || require.resolve('axe-core/axe.min.js'),
    });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        });
        return result.violations.map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        }));
      });
      assert.deepEqual(violations, [], `Accessibility failures at ${width}px`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  });
}
