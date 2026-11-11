import { handleAiRequest } from '../server/ai-handler.js';

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

function readHeader(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({
      error: { code: 'AI_INVALID_REQUEST', message: 'Use POST for the writing room.' },
    });
    return;
  }

  const clientId = readHeader(req.headers['x-daybook-client']).slice(0, 80) || 'anonymous';
  const result = await handleAiRequest(req.body, process.env, clientId);
  res.status(result.status).json(result.body);
}
