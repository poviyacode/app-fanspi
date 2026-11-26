import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  const apiBaseUrl = process.env['API_BASE_URL'] || 'https://api.poviya.com';

  // CONFIGURACIÓN AQUÍ: Se pasan los dominios permitidos al instanciar el motor
  const commonEngine = new CommonEngine({
    allowedHosts: ['fanspi.com', 'www.fanspi.com', 'localhost']
  });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Proxy hacia el backend API
  server.use('/api', async (req, res) => {
    try {
      // Si tu API en api.poviya.com espera /api/..., mantén req.originalUrl; si no, usa req.url
      const targetUrl = `${apiBaseUrl}${req.originalUrl}`;

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        if (value && !['host', 'content-length', 'connection', 'transfer-encoding'].includes(lowerKey)) {
          headers[key] = Array.isArray(value) ? value.join(', ') : value;
        }
      }

      const method = req.method.toUpperCase();
      const hasBody = !['GET', 'HEAD'].includes(method);

      const fetchOptions: RequestInit & { duplex?: 'half' } = {
        method,
        headers,
        body: hasBody ? (req as unknown as BodyInit) : undefined,
        ...(hasBody ? { duplex: 'half' } : {}),
      };

      const upstreamResponse = await fetch(targetUrl, fetchOptions);
      res.status(upstreamResponse.status);

      upstreamResponse.headers.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(lowerKey)) {
          res.setHeader(key, val);
        }
      });

      const arrayBuffer = await upstreamResponse.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('SSR API proxy error:', error);
      res.status(502).json({ message: 'Bad Gateway' });
    }
  });

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();