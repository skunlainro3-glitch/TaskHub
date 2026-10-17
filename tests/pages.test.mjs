import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handlePages } from '../cloud/pages/worker.mjs';
import { signProxyRequest, verifyProxyRequest } from '../cloud/pages/proxy-auth.mjs';

const env = { TASKHUB_PROXY_SECRET: 'Pages-test-only-secret-not-used-in-production-2026', TASKHUB_BACKEND_URL: 'https://taskhub.ninaninohihi.chatgpt.site' };
const base = 'https://taskhub-test.pages.dev';
const client = (path, options = {}) => new Request(base + path, {
  ...options, headers: { 'CF-Connecting-IP': '203.0.113.7', ...options.headers },
});
const noFetch = () => { throw Error('Upstream must not be called.'); };

test('Pages rejects cross-origin writes before forwarding, including a null origin', async () => {
  for (const origin of ['https://attacker.example', 'null', base + '.attacker.example']) {
    const response = await handlePages(client('/api/login', { method: 'POST', headers: { Origin: origin, 'X-TaskHub': '1' }, body: '{}' }), env, noFetch);
    assert.equal(response.status, 403);
  }
});

test('Pages preserves API writes and only the application cookie; signed IP verifies at backend', async () => {
  const body = JSON.stringify({ title: 'A tour update' });
  let calls = 0;
  const response = await handlePages(client('/api/tours/tour-1?v=2', {
    method: 'PUT', body,
    headers: { Origin: base, 'Content-Type': 'application/json', 'X-TaskHub': '1', Cookie: 'unrelated=private; taskhub_session=session123', 'X-TaskHub-Proxy-IP': '10.0.0.1', Authorization: 'private-other-service' },
  }), env, async (url, init) => {
    calls++;
    const forwarded = new Request(url, init);
    assert.equal(forwarded.url, env.TASKHUB_BACKEND_URL + '/api/tours/tour-1?v=2');
    assert.equal(forwarded.method, 'PUT');
    assert.equal(await forwarded.text(), body);
    assert.equal(forwarded.headers.get('Origin'), env.TASKHUB_BACKEND_URL);
    assert.equal(forwarded.headers.get('Cookie'), 'taskhub_session=session123');
    assert.equal(forwarded.headers.get('Authorization'), null);
    assert.equal(forwarded.headers.get('X-TaskHub'), '1');
    assert.equal(verifyProxyRequest(forwarded, env.TASKHUB_PROXY_SECRET), '203.0.113.7');
    const headers = new Headers();
    headers.append('Set-Cookie', 'gateway_cookie=unrelated; Secure');
    headers.append('Set-Cookie', 'taskhub_session=new123; HttpOnly; Secure; SameSite=Lax; Path=/');
    return new Response('{"ok":true}', { status: 201, headers });
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 201);
  assert.deepEqual(response.headers.getSetCookie(), ['taskhub_session=new123; HttpOnly; Secure; SameSite=Lax; Path=/']);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('Proxy attestation rejects tampering, other methods/paths, expired proofs and wrong keys', () => {
  const request = client('/api/login', { method: 'POST', body: '{}' });
  const now = Date.now();
  const signed = signProxyRequest(request, '2001:db8::1', env.TASKHUB_PROXY_SECRET, now);
  const proof = (url = request.url, headers = signed, method = 'POST') => new Request(url, { method, headers });
  assert.equal(verifyProxyRequest(proof(), env.TASKHUB_PROXY_SECRET, now), '2001:db8::1');
  assert.equal(verifyProxyRequest(proof(), env.TASKHUB_PROXY_SECRET, now + 60001), null);
  assert.equal(verifyProxyRequest(proof(), env.TASKHUB_PROXY_SECRET + 'wrong', now), null);
  assert.equal(verifyProxyRequest(proof(base + '/api/register'), env.TASKHUB_PROXY_SECRET, now), null);
  assert.equal(verifyProxyRequest(proof(request.url, signed, 'GET'), env.TASKHUB_PROXY_SECRET, now), null);
  assert.equal(verifyProxyRequest(proof(request.url, { ...signed, 'x-taskhub-proxy-ip': '203.0.113.8' }), env.TASKHUB_PROXY_SECRET, now), null);
  assert.equal(verifyProxyRequest(proof(request.url, { ...signed, 'x-taskhub-proxy-signature': '00' }), env.TASKHUB_PROXY_SECRET, now), null);
});

test('Pages bounds request size and never retries failed writes', async () => {
  assert.equal((await handlePages(client('/api/register', { method: 'POST', body: 'x'.repeat(32769) }), env, noFetch)).status, 413);
  let calls = 0;
  const result = await handlePages(client('/api/register', { method: 'POST', body: '{}' }), env, async () => { calls++; throw Error('network failure'); });
  assert.equal(result.status, 503);
  assert.equal(calls, 1);
  assert.match((await result.json()).message, /thử lại/);
});

test('Pages forwards API errors and rewrites same-backend redirects to the public origin', async () => {
  const error = await handlePages(client('/api/tours/x'), env, async () => Response.json({ message: 'Conflict' }, { status: 409 }));
  assert.equal(error.status, 409);
  assert.deepEqual(await error.json(), { message: 'Conflict' });
  const redirect = await handlePages(client('/api/login'), env, async () => new Response(null, { status: 303, headers: { Location: env.TASKHUB_BACKEND_URL + '/app?q=1' } }));
  assert.equal(redirect.headers.get('Location'), base + '/app?q=1');
});

test('Pages serves deep application routes and assets without proxying HTML or other services', async () => {
  const seen = [];
  const bindings = { ...env, ASSETS: { fetch: async request => { seen.push(new URL(request.url).pathname); return new Response('<html>TaskHub</html>'); } } };
  for (const path of ['/', '/app', '/portal/workspace-123', '/assets/app.js']) {
    const response = await handlePages(client(path), bindings, noFetch);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  }
  assert.deepEqual(seen, ['/', '/', '/', '/assets/app.js']);
  assert.equal((await handlePages(client('/app', { method: 'POST', body: '{}' }), bindings, noFetch)).status, 405);
});

test('Pages fails closed when proxy credentials, backend or trusted client address are missing', async () => {
  for (const bindings of [{ ...env, TASKHUB_PROXY_SECRET: '' }, { ...env, TASKHUB_BACKEND_URL: 'https://attacker.example' }, { ...env, TASKHUB_BACKEND_URL: undefined }]) {
    assert.equal((await handlePages(client('/api/health'), bindings, noFetch)).status, 503);
  }
  assert.equal((await handlePages(new Request(base + '/api/health'), env, noFetch)).status, 503);
});
