import assert from 'node:assert/strict';

export async function testDemoBoundaries(page, check) {
  const button = page.locator('#record-button');
  const reset = () => page.locator('#reset-demo').click();
  const state = (expected) =>
    page.waitForFunction(
      (value) => document.querySelector('#record-button').dataset.state === value,
      expected,
    );

  await check('Toggle ignores Enter key auto-repeat and stops on the next press', async () => {
    await reset();
    await page.locator('#toggle-recording').check({ force: true });
    await button.focus();
    await page.keyboard.down('Enter');
    await state('recording');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.equal(await button.getAttribute('data-state'), 'recording');
    await page.keyboard.press('Enter');
    await state('done');
    await page.locator('#toggle-recording').uncheck({ force: true });
  });
  await check('Assistive-technology click can repeat an already completed demo', async () => {
    await button.evaluate((element) => element.click());
    await state('recording');
    await state('done');
    await button.evaluate((element) => element.click());
    await state('recording');
    await state('done');
  });
  for (const outcome of ['resolve', 'reject']) {
    await check(`Late clipboard ${outcome} cannot undo Reset or take focus`, async () => {
      await page.locator('#demo-output').fill('A transcript to copy.');
      await page.evaluate(() => {
        navigator.clipboard.writeText = () =>
          new Promise((resolve, reject) => {
            window.finishCopy = { resolve, reject: () => reject(Error('Clipboard unavailable')) };
          });
      });
      await page.locator('#copy-demo').click();
      await reset();
      const announcement = await page.locator('#demo-announcement').textContent();
      await page.evaluate((result) => window.finishCopy[result](), outcome);
      assert.equal(await page.locator('#demo-announcement').textContent(), announcement);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'reset-demo');
      assert.equal(await page.locator('#demo-output').inputValue(), '');
      assert.equal(await button.getAttribute('data-state'), 'idle');
    });
  }
}
