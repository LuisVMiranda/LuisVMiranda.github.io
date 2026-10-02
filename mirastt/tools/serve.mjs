// Local preview and acceptance server. Deploy the static files to your host.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pipeline } from 'node:stream/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.exe': 'application/octet-stream',
  '.gz': 'application/gzip',
};

function resolveFile(url, mount) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  if (!pathname.startsWith(mount) || pathname.includes('\0')) return null;
  const relative = pathname.slice(mount.length) || 'index.html';
  const path = resolve(root, relative);
  return path.startsWith(root + sep) ? path : null;
}

async function respond(request, response, mount) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const path = resolveFile(request.url, mount);
    if (!path) {
      response.writeHead(404).end('Not found');
      return;
    }
    const info = await stat(path);
    if (!info.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    await pipeline(createReadStream(path), response);
  } catch (error) {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    const code = error.code === 'ENOENT' ? 404 : 400;
    response.writeHead(code).end(code === 404 ? 'Not found' : 'Invalid request');
  }
}

export async function startServer(port = 4173, mount = '/') {
  const server = createServer((request, response) => respond(request, response, mount));
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', accept);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = await startServer(Number(process.env.PORT || 4173));
  console.log(`Mira website: http://127.0.0.1:${server.address().port}`);
}
