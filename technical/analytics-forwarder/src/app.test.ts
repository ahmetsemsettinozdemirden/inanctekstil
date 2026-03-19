import { describe, test, expect } from 'bun:test';
import { app } from './app.ts';

describe('GET /health', () => {
  test('returns 200 with { status: "ok" }', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});
