import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { expect, test } from '@playwright/test';

test('the static preview server honors an isolated port', async () => {
  const reservation = createServer();
  await new Promise<void>((resolve) =>
    reservation.listen(0, '127.0.0.1', resolve),
  );
  const address = reservation.address();
  if (!address || typeof address === 'string')
    throw new Error('Could not reserve an ephemeral TCP port');
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );

  const child = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  try {
    await expect
      .poll(
        async () => {
          if (child.exitCode !== null) return 0;
          try {
            return (await fetch(`http://127.0.0.1:${port}/news/`)).status;
          } catch {
            return 0;
          }
        },
        { timeout: 10_000 },
      )
      .toBe(200);
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise<void>((resolve) =>
        child.once('exit', () => resolve()),
      );
      child.kill();
      await Promise.race([
        exited,
        new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
      ]);
    }
  }
});
