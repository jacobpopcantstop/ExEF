import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import {
  getCopyLabPageSet,
  getWorkspaceState,
  saveChunkEdit,
  skipChunk
} from './copy-lab-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const toolDir = path.resolve(rootDir, 'tools/copy-lab');
const progressPath = path.resolve(rootDir, 'tmp/copy-lab-progress.json');
const host = '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '4311', 10);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    request.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.length > 1_000_000) {
        reject(new Error('Request body too large.'));
      }
    });
    request.on('end', () => resolve(buffer));
    request.on('error', reject);
  });
}

function renderShell() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ExEF Copy Lab</title>
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>`;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`);

    if (request.method === 'GET' && url.pathname === '/') {
      sendText(response, 200, renderShell(), 'text/html; charset=utf-8');
      return;
    }

    if (request.method === 'GET' && url.pathname === '/styles.css') {
      sendText(response, 200, fs.readFileSync(path.join(toolDir, 'styles.css'), 'utf8'), 'text/css; charset=utf-8');
      return;
    }

    if (request.method === 'GET' && url.pathname === '/app.js') {
      sendText(response, 200, fs.readFileSync(path.join(toolDir, 'app.js'), 'utf8'), 'application/javascript; charset=utf-8');
      return;
    }

    if (request.method === 'GET' && url.pathname === '/favicon.svg') {
      response.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(path.join(rootDir, 'favicon.svg')).pipe(response);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/state') {
      const selectedFile = url.searchParams.get('file') || '';
      sendJson(response, 200, getWorkspaceState(rootDir, progressPath, selectedFile));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/save') {
      const payload = JSON.parse(await readBody(request) || '{}');
      sendJson(response, 200, saveChunkEdit(rootDir, progressPath, payload));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/skip') {
      const payload = JSON.parse(await readBody(request) || '{}');
      sendJson(response, 200, skipChunk(rootDir, progressPath, payload));
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/preview/')) {
      const relativePath = decodeURIComponent(url.pathname.replace('/preview/', ''));
      if (!getCopyLabPageSet(rootDir).has(relativePath)) {
        sendText(response, 404, 'Not found');
        return;
      }
      const targetPath = path.resolve(rootDir, relativePath);
      if (!targetPath.startsWith(rootDir) || !targetPath.endsWith('.html') || !fs.existsSync(targetPath)) {
        sendText(response, 404, 'Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(targetPath).pipe(response);
      return;
    }

    sendText(response, 404, 'Not found');
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected error.'
    });
  }
});

server.listen(port, host, () => {
  console.log(`Copy Lab running at http://${host}:${port}`);
});
