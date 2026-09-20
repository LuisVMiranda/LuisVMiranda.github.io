import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Development-only static host; Pages receives files without a Node runtime.
const manifest = JSON.parse(
  await readFile('artifacts/pages-build.json', 'utf8'),
);
const root = path.resolve(process.env.PAGES_DIRECTORY || manifest.directory);
/** @type {Record<string, string>} */
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};
createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost');
    let file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(root + path.sep) && file !== root)
      throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    });
    response.end(body);
  } catch {
    const body = await readFile(path.join(root, '404.html'));
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(body);
  }
}).listen(4321, '127.0.0.1', () =>
  console.log('Pages preview: http://127.0.0.1:4321/news/'),
);
