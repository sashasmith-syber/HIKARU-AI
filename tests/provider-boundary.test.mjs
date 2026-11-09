import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { requireServerSideProvider } from '../src/services/providerAvailability.mjs';

const service = await readFile(new URL('../src/services/geminiService.ts', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

test('provider requests fail closed without a server-side backend', () => {
  assert.throws(
    requireServerSideProvider,
    /Gemini requests are disabled until an authorized server-side backend is configured/,
  );
});

test('every Gemini entry point checks the server-side boundary before using the SDK', () => {
  for (const name of [
    'generateImage',
    'startChat',
    'generateOneOffContentStream',
    'generateJsonContent',
    'connectLiveSession',
  ]) {
    const start = service.indexOf(`export const ${name}`);
    assert.notEqual(start, -1, `${name} entry point exists`);
    const next = service.indexOf('\nexport ', start + 1);
    const implementation = service.slice(start, next === -1 ? undefined : next);
    const guard = implementation.indexOf('requireServerSideProvider()');
    const sdkCall = implementation.search(/\bcreateAiClient\(\)/);
    assert.notEqual(guard, -1, `${name} checks the backend gate`);
    assert.ok(sdkCall === -1 || guard < sdkCall, `${name} checks the gate before SDK use`);
  }
});

test('Vite does not inline Gemini credentials into browser code', () => {
  assert.doesNotMatch(viteConfig, /loadEnv|process\.env\.(?:API_KEY|GEMINI_API_KEY)|define\s*:/);
  assert.doesNotMatch(service, /process\.env\.(?:API_KEY|GEMINI_API_KEY)/);
});
