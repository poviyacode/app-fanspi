import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import bootstrap from './src/main.server';

export function app(): express.Express {
  const server = express();
  server.set('trust proxy', true);

  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  const clientIndex = existsSync(join(browserDistFolder, 'index.csr.html'))
    ? join(browserDistFolder, 'index.csr.html')
    : join(browserDistFolder, 'index.html');

  const apiBaseUrl = process.env['API_BASE_URL'] || 'https://api.fanspi.com';

  const commonEngine = new CommonEngine({
    allowedHosts: ['*'],
  });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Proxy hacia el backend API
  server.use('/api', async (req, res) => {
    try {
      // Si tu API en api.fanspi.com espera /api/..., mantén req.originalUrl; si no, usa req.url
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

  // 1. Servir archivos estáticos desde /browser
  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
      setHeaders: (res, filePath) => {
        if (
          filePath.endsWith('.html') ||
          filePath.endsWith('ngsw.json') ||
          filePath.endsWith('manifest.webmanifest')
        ) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    }),
  );

  // 2. Evitar que peticiones a archivos con extensión no encontrados caigan en SSR
  server.get('*.*', (_req, res) => {
    res.status(404).type('text/plain').send('Resource not found');
  });

  // 3. Renderizado SSR para rutas de la aplicación
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const rawHost = (headers['x-forwarded-host'] as string) || headers.host || 'localhost';
    const host = rawHost.split(',')[0].trim();
    const rawProto = (headers['x-forwarded-proto'] as string)?.split(',')[0].trim();
    const proto = rawProto || protocol || 'https';
    const fullUrl = `${proto}://${host}${originalUrl}`;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: fullUrl,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl || '/' }],
      })
      .then((html) => res.send(html))
      .catch((err) => {
        console.error('SSR render error for:', originalUrl, err);
        res.sendFile(clientIndex, (sendErr) => {
          if (sendErr) next(err);
        });
      });
  });

  return server;
}

function run(): void {
  const port = Number(process.env['PORT']) || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();