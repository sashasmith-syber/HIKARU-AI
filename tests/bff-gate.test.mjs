import assert from 'node:assert/strict';
import worker from '../server/worker.mjs';

const TOKEN = 'local-preview-token';
const KEY = 'local-test-not-a-real-key';

const upstreamCalls = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (url, init) => {
  const target = String(url);
  upstreamCalls.push({
    host: new URL(target).host,
    path: new URL(target).pathname,
    hasKeyQuery: new URL(target).searchParams.has('key'),
  });
  if (target.includes(':streamGenerateContent')) {
    return new Response('data: {"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}\n\n', {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
  }
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: '{"scenarios":[]}' }] } }],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

const chatBody = JSON.stringify({
  messages: [{ role: 'user', parts: [{ text: 'hello operator' }] }],
  model: 'gemini-3-flash-preview',
  systemInstruction: 'You are Hikaru.',
});

const request = (path, { method = 'POST', token, ip = '203.0.113.10', body = chatBody } = {}) =>
  new Request(`http://preview.local${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': ip,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'GET' ? undefined : body,
  });

const envWithBoth = { GEMINI_API_KEY: KEY, PREVIEW_AUTH_TOKEN: TOKEN };
const envMissingKey = { PREVIEW_AUTH_TOKEN: TOKEN };

let failed = 0;
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
};

await check('health does not require auth and does not call Gemini', async () => {
  const before = upstreamCalls.length;
  const response = await worker.fetch(request('/api/health', { method: 'GET', ip: '203.0.113.1' }), envWithBoth);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.configured, true);
  assert.equal(body.authRequired, true);
  assert.equal(upstreamCalls.length, before);
});

await check('missing GEMINI_API_KEY is visible on health', async () => {
  const response = await worker.fetch(request('/api/health', { method: 'GET', ip: '203.0.113.2' }), envMissingKey);
  const body = await response.json();
  assert.equal(body.configured, false);
  assert.equal(body.authRequired, true);
});

for (const path of ['/api/chat', '/api/chat/stream', '/api/image/generate', '/api/features']) {
  await check(`unauthorized ${path} is rejected before Gemini`, async () => {
    const before = upstreamCalls.length;
    const method = path === '/api/features' ? 'GET' : 'POST';
    const body = path === '/api/image/generate' ? JSON.stringify({ prompt: 'a lighthouse' }) : chatBody;
    const response = await worker.fetch(request(path, { method, ip: `203.0.113.${path.length}`, body }), envWithBoth);
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.code, 'AUTH_REQUIRED');
    assert.equal(upstreamCalls.length, before);
  });
}

await check('wrong bearer token is rejected before Gemini', async () => {
  const before = upstreamCalls.length;
  const response = await worker.fetch(request('/api/chat', { token: 'wrong-token', ip: '203.0.113.20' }), envWithBoth);
  assert.equal(response.status, 401);
  assert.equal(upstreamCalls.length, before);
});

await check('authorized request with missing GEMINI_API_KEY does not call Gemini', async () => {
  const before = upstreamCalls.length;
  const response = await worker.fetch(request('/api/chat', { token: TOKEN, ip: '203.0.113.21' }), envMissingKey);
  assert.equal(response.status, 503);
  assert.equal(upstreamCalls.length, before);
});

await check('unknown model is rejected and not substituted', async () => {
  const before = upstreamCalls.length;
  const response = await worker.fetch(request('/api/chat', {
    token: TOKEN,
    ip: '203.0.113.22',
    body: JSON.stringify({
      messages: [{ role: 'user', parts: [{ text: 'hello' }] }],
      model: 'gemini-not-a-real-model',
    }),
  }), envWithBoth);
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.error, /Invalid model/);
  assert.equal(upstreamCalls.length, before);
});

await check('authorized chat calls Gemini once and does not echo the key', async () => {
  const before = upstreamCalls.length;
  const response = await worker.fetch(request('/api/chat', { token: TOKEN, ip: '203.0.113.23' }), envWithBoth);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(typeof payload.text, 'string');
  assert.equal(JSON.stringify(payload).includes(KEY), false);
  assert.equal(upstreamCalls.length, before + 1);
  assert.equal(upstreamCalls.at(-1).host, 'generativelanguage.googleapis.com');
  assert.equal(upstreamCalls.at(-1).path, '/v1beta/models/gemini-3-flash-preview:generateContent');
  assert.equal(upstreamCalls.at(-1).hasKeyQuery, true);
});

await check('rate limit rejects the 11th request before Gemini', async () => {
  const ip = '203.0.113.50';
  let limited = null;
  for (let i = 0; i < 11; i += 1) {
    const before = upstreamCalls.length;
    const response = await worker.fetch(request('/api/chat', { token: TOKEN, ip }), envWithBoth);
    if (i < 10) {
      assert.equal(response.status, 200);
      assert.equal(upstreamCalls.length, before + 1);
    } else {
      limited = response;
      assert.equal(response.status, 429);
      assert.equal(upstreamCalls.length, before);
    }
  }
  assert.equal(limited.headers.get('retry-after') !== null, true);
});

globalThis.fetch = originalFetch;

if (failed > 0) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('ALL BFF GATE CHECKS PASSED');
