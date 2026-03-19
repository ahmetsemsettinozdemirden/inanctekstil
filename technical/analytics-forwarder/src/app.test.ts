import { describe, test, expect } from 'bun:test';
import { app, verifyShopifyHmac } from './app.ts';

// Generate a real HMAC for test vectors using Web Crypto
async function makeHmac(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

describe('verifyShopifyHmac', () => {
  const SECRET = 'test_webhook_secret';
  const BODY = '{"id":1,"total_price":"1250.00"}';

  test('returns true for a valid HMAC', async () => {
    const hmac = await makeHmac(SECRET, BODY);
    const result = await verifyShopifyHmac(SECRET, BODY, hmac);
    expect(result).toBe(true);
  });

  test('returns false for a tampered body', async () => {
    const hmac = await makeHmac(SECRET, BODY);
    const result = await verifyShopifyHmac(SECRET, BODY + 'x', hmac);
    expect(result).toBe(false);
  });

  test('returns false for a wrong secret', async () => {
    const hmac = await makeHmac('wrong_secret', BODY);
    const result = await verifyShopifyHmac(SECRET, BODY, hmac);
    expect(result).toBe(false);
  });

  test('returns false for empty hmac header', async () => {
    const result = await verifyShopifyHmac(SECRET, BODY, '');
    expect(result).toBe(false);
  });
});

describe('GET /health', () => {
  test('returns 200 with { status: "ok" }', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});
