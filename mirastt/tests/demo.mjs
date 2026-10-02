import assert from 'node:assert/strict';
import { resolve } from 'node:path';

async function state(page, expected) {
  await page.waitForFunction(
    (value) => document.querySelector('#record-button').dataset.state === value,
    expected,
  );
}

async function finishedText(page) {
  await state(page, 'done');
  const expected = (await page.locator('#spoken-example').textContent()).slice(1, -1);
  assert.equal(await page.locator('#demo-output').inputValue(), expected);
}

export async function testDemo(page, check, artifacts) {
  const record = page.locator('#record-button');
  const reset = async () => {
    await page.locator('#reset-demo').click();
    await state(page, 'idle');
  };
  await check('Hold to record; release delivers and pill dismisses after one second', async () => {
    await reset();
    await record.scrollIntoViewIfNeeded();
    await record.hover();
    await page.mouse.down();
    await state(page, 'recording');
    await page.waitForTimeout(1100);
    assert.equal(await record.getAttribute('data-state'), 'recording');
    assert.equal(await page.locator('#demo-timer').textContent(), '00:01');
    assert.equal(await page.locator('#demo-output').inputValue(), '');
    await page.screenshot({ path: resolve(artifacts, 'demo-recording.png') });
    await page.mouse.up();
    await state(page, 'processing');
    await page.waitForTimeout(650);
    assert.ok((await page.locator('#demo-pill').getAttribute('class')).includes('visible'));
    await finishedText(page);
    await page.waitForTimeout(500);
    assert.ok(!(await page.locator('#demo-pill').getAttribute('class')).includes('visible'));
    await page.screenshot({ path: resolve(artifacts, 'demo-delivered.png') });
  });
  await check('Portuguese examples and toggle recording deliver the selected text', async () => {
    await page.locator('[data-demo-language="pt"]').click();
    await page.locator('[data-example="idea"]').click();
    await page.locator('#toggle-recording').check({ force: true });
    await record.click();
    await state(page, 'recording');
    await page.waitForTimeout(350);
    await record.click();
    await finishedText(page);
    assert.match(await page.locator('#demo-output').inputValue(), /reunião/);
    await page.locator('#toggle-recording').uncheck({ force: true });
  });
  await check('Keyboard hold and release work without a mouse', async () => {
    await reset();
    await record.focus();
    await page.keyboard.down('Space');
    await state(page, 'recording');
    await page.keyboard.up('Space');
    await finishedText(page);
  });
  await check('Focus leaving a held keyboard button cannot leave recording stuck', async () => {
    await reset();
    await record.focus();
    await page.keyboard.down('Space');
    await page.locator('#demo-output').focus();
    await page.keyboard.up('Space');
    await finishedText(page);
  });
  await check('Reset cancels pending delivery with no late text or toast', async () => {
    await reset();
    await record.click();
    await state(page, 'processing');
    await reset();
    await page.waitForTimeout(1500);
    assert.equal(await record.getAttribute('data-state'), 'idle');
    assert.equal(await page.locator('#demo-output').inputValue(), '');
    assert.ok(!(await page.locator('#delivery-toast').getAttribute('class')).includes('visible'));
  });
  await check('Escape cancels recording and stale timer callbacks', async () => {
    await record.focus();
    await page.keyboard.down('Space');
    await page.keyboard.press('Escape');
    await page.keyboard.up('Space');
    await page.waitForTimeout(1300);
    assert.equal(await record.getAttribute('data-state'), 'idle');
    assert.equal(await page.locator('#demo-output').inputValue(), '');
  });
  await check('Clipboard writes are opt-in and retain user edits', async () => {
    await page.evaluate(() => {
      window.copied = [];
      navigator.clipboard.writeText = async (text) => {
        window.copied.push(text);
      };
    });
    await record.click();
    await finishedText(page);
    assert.deepEqual(await page.evaluate(() => window.copied), []);
    await page.locator('#demo-output').fill('Olá, Mira! Edited by me.');
    await page.locator('#copy-demo').click();
    assert.deepEqual(await page.evaluate(() => window.copied), ['Olá, Mira! Edited by me.']);
  });
  await check('Clipboard refusal selects text and offers a manual copy fallback', async () => {
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {
        throw Error('denied');
      };
    });
    await page.locator('#copy-demo').click();
    await page.waitForFunction(() =>
      document.querySelector('#demo-announcement').textContent.includes('selected'),
    );
    const selection = await page.locator('#demo-output').evaluate((element) => ({
      focused: document.activeElement === element,
      start: element.selectionStart,
      end: element.selectionEnd,
      length: element.value.length,
    }));
    assert.equal(selection.focused, true);
    assert.equal(selection.start, 0);
    assert.equal(selection.end, selection.length);
  });
}
