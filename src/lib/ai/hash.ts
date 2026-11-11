import { PROMPT_VERSION } from '@shared/prompt-version';

export function hashString(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function piecesHash(pieces: Array<{ id: string; text: string }>): string {
  return hashString(
    `v${PROMPT_VERSION}|` +
      pieces
        .map((piece) => `${piece.id}:${piece.text}`)
        .sort()
        .join('|'),
  );
}
