import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { handleAiRequest } from './ai-handler.js';

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : null);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export function aiDevPlugin(): Plugin {
  return {
    name: 'daybook-ai-dev',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        if (req.method !== 'POST') {
          send(res, 405, {
            error: { code: 'AI_INVALID_REQUEST', message: 'Use POST for the writing room.' },
          });
          return;
        }
        try {
          const body = await readBody(req);
          const clientId = String(req.headers['x-daybook-client'] ?? 'local').slice(0, 80);
          const result = await handleAiRequest(body, process.env, clientId);
          send(res, result.status, result.body);
        } catch {
          send(res, 400, {
            error: { code: 'AI_INVALID_REQUEST', message: 'That request could not be read.' },
          });
        }
      });
    },
  };
}
