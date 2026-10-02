import assert from "node:assert/strict";

const windows =
  "https://drive.google.com/file/d/1VGaIit63rWNN1HW6XZC-vbfUmp1gaRSj/view?usp=sharing";
const linux =
  "https://drive.google.com/file/d/1-tH6MmVPzTqVhrS9xdHLvkw3N3PqHaxN/view?usp=sharing";

export async function testDownloads(browser, base, check, release) {
  await check(
    "Windows hero/card and Linux choice navigate to the correct Drive file without JavaScript",
    async () => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      // Verify the navigation contract without downloading binaries or depending on Drive's UI.
      await context.route("https://drive.google.com/**", (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<title>Drive destination fixture</title>",
        }),
      );
      const page = await context.newPage();
      try {
        const choices = [
          [".hero a.button-ink", windows],
          [".download-card.recommended", windows],
          ["a.download-card:not(.recommended)", linux],
        ];
        for (const [selector, url] of choices) {
          await page.goto(base);
          const link = page.locator(selector);
          assert.equal(await link.getAttribute("href"), url);
          assert.equal(await link.getAttribute("download"), null);
          await link.click();
          await page.waitForURL(url);
          assert.equal(page.url(), url);
        }
      } finally {
        await context.close();
      }
    },
  );
  await check(
    "Release metadata maps each platform to its Drive file and keeps checksums local",
    async () => {
      const actual = await (
        await fetch(`${base}/downloads/release.json`)
      ).json();
      assert.deepEqual(actual, release);
      assert.equal(
        actual.artifacts.find((item) => item.platform === "windows-x64").url,
        windows,
      );
      assert.equal(
        actual.artifacts.find((item) => item.platform === "linux-x64").url,
        linux,
      );
      assert.equal(
        (await fetch(`${base}/downloads/checksums.txt`)).status,
        200,
      );
    },
  );
}
