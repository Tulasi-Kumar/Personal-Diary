import {
  AiResultSchema,
  isAiErrorBody,
  type AiErrorCode,
  type AiRequest,
  type AiResult,
} from '@shared/ai-contracts';
import { kvGet, kvSet } from '../db/repositories';

const CLIENT_ID_KEY = 'daybook:ai-client';

export class AiClientError extends Error {
  code: AiErrorCode;
  status: number;

  constructor(code: AiErrorCode, message: string, status: number) {
    super(message);
    this.name = 'AiClientError';
    this.code = code;
    this.status = status;
  }
}

async function getClientId(): Promise<string> {
  const existing = await kvGet<string>(CLIENT_ID_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await kvSet(CLIENT_ID_KEY, id);
  return id;
}

export async function callAi(request: AiRequest): Promise<AiResult> {
  const clientId = await getClientId();
  let response: Response;
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-daybook-client': clientId,
      },
      body: JSON.stringify(request),
    });
  } catch {
    throw new AiClientError(
      'AI_UNAVAILABLE',
      'You are offline. Your words are safe, and the writing room will wait.',
      0,
    );
  }

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    if (isAiErrorBody(data)) {
      throw new AiClientError(data.error.code, data.error.message, response.status);
    }
    throw new AiClientError(
      'AI_UPSTREAM',
      'The writing room could not be reached. Keep writing; nothing is lost.',
      response.status,
    );
  }

  const parsed = AiResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new AiClientError(
      'AI_INVALID_RESPONSE',
      'That one could not be shaped. Your original words are unchanged.',
      502,
    );
  }
  return parsed.data;
}
