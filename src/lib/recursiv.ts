import { Recursiv } from '@recursiv/sdk';

let _client: Recursiv | null = null;

export function getRecursiv(): Recursiv {
  if (!_client) {
    _client = new Recursiv({
      ...(process.env.RECURSIV_API_BASE_URL && { baseUrl: process.env.RECURSIV_API_BASE_URL }),
    });
  }
  return _client;
}

export const AGENT_ID = process.env.DIBS_AGENT_ID || '076a1c14-f509-4529-a2dd-1f79d2f89f93';
