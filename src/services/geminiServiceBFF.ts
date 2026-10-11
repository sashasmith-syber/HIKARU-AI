/**
 * HIKARU v3.6 BFF Client Service
 * 
 * All Gemini API calls go through the backend-for-frontend.
 * No API keys are exposed to the browser.
 * 
 * Authentication:
 * - Users must provide a preview access token
 * - Token is stored in localStorage (not embedded in code)
 * - Token is sent via Authorization: Bearer header
 */

// Type enum for JSON schema definitions (matches @google/genai Type)
export const Type = {
  TYPE_UNSPECIFIED: 'TYPE_UNSPECIFIED',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
  NULL: 'NULL',
} as const;

export interface Message {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export interface ChatConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  thinkingConfig?: { thinkingBudget: number };
  responseMimeType?: string;
  responseSchema?: any;
}

export interface BackendFeatures {
  chat: boolean;
  chatStream: boolean;
  imageGeneration: boolean;
  jsonGeneration: boolean;
  liveAudio: boolean;
  configured: boolean;
  limits?: {
    rateLimit: { perMinute: number; perHour: number };
    maxPayloadBytes: number;
    maxMessages: number;
    maxTextLength: number;
    maxOutputTokens: number;
  };
  allowedModels?: string[];
}

export class BackendUnavailableError extends Error {
  constructor(message: string = 'Backend service is unavailable') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

export class BackendNotConfiguredError extends Error {
  constructor(message: string = 'Backend is not configured with API credentials') {
    super(message);
    this.name = 'BackendNotConfiguredError';
  }
}

export class AuthenticationRequiredError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'hikaru_preview_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

export function clearStoredAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // localStorage unavailable
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredAuthToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearStoredAuthToken();
    throw new AuthenticationRequiredError();
  }
  
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    throw new RateLimitError('Rate limit exceeded', retryAfter);
  }
  
  if (response.status === 503) {
    throw new BackendNotConfiguredError();
  }
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

export async function checkBackendHealth(): Promise<{ status: string; configured: boolean; authRequired: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await handleResponse(response);
  } catch (err) {
    if (err instanceof AuthenticationRequiredError || err instanceof RateLimitError) {
      throw err;
    }
    throw new BackendUnavailableError();
  }
}

export async function getBackendFeatures(): Promise<BackendFeatures> {
  const response = await fetch(`${API_BASE}/features`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(response);
}

export async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await fetch(`${API_BASE}/image/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ prompt }),
  });
  
  const data = await handleResponse<{ image: string }>(response);
  return data.image;
}

export interface ChatSession {
  sendMessageStream(options: { message: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }): AsyncGenerator<{ text: string }, void, unknown>;
}

export function startChat(
  systemInstruction: string,
  model: string = 'gemini-3-flash-preview',
  config: ChatConfig = {}
): ChatSession {
  const history: Message[] = [];
  
  return {
    async *sendMessageStream(options: { message: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }) {
      history.push({ role: 'user', parts: options.message });
      
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          messages: history,
          systemInstruction,
          model,
          config,
        }),
      });
      
      if (response.status === 401) {
        clearStoredAuthToken();
        throw new AuthenticationRequiredError();
      }
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        throw new RateLimitError('Rate limit exceeded', retryAfter);
      }
      
      if (response.status === 503) {
        throw new BackendNotConfiguredError();
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Stream failed' }));
        throw new Error(errorData.error || 'Stream request failed');
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const text = data?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p?.text || '')
                .join('') || '';
              if (text) {
                fullText += text;
                yield { text };
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
      
      history.push({ role: 'model', parts: [{ text: fullText }] });
    },
  };
}

export async function* generateOneOffContentStream(
  text: string,
  attachmentFile: File | null,
  systemInstruction: string,
  model: string = 'gemini-3-flash-preview',
  config: ChatConfig = {}
): AsyncGenerator<{ text: string }, void, unknown> {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  
  if (attachmentFile) {
    parts.push(await fileToGenerativePart(attachmentFile));
  }
  if (text.trim()) {
    parts.push({ text });
  }
  
  if (parts.length === 0) return;
  
  const messages: Message[] = [{ role: 'user', parts }];
  
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      messages,
      systemInstruction,
      model,
      config,
    }),
  });
  
  if (response.status === 401) {
    clearStoredAuthToken();
    throw new AuthenticationRequiredError();
  }
  
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    throw new RateLimitError('Rate limit exceeded', retryAfter);
  }
  
  if (response.status === 503) {
    throw new BackendNotConfiguredError();
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Stream failed' }));
    throw new Error(errorData.error || 'Stream request failed');
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;
        try {
          const data = JSON.parse(jsonStr);
          const text = data?.candidates?.[0]?.content?.parts
            ?.map((p: any) => p?.text || '')
            .join('') || '';
          if (text) {
            yield { text };
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

export async function generateJsonContent<T>(
  prompt: string,
  schema: any,
  model: string = 'gemini-3-flash-preview'
): Promise<T> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      messages: [{ role: 'user', parts: [{ text: prompt }] }],
      model,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  });
  
  const data = await handleResponse<{ text: string }>(response);
  
  try {
    return JSON.parse(data.text.trim());
  } catch {
    throw new Error('Invalid JSON response from model');
  }
}

// Live session is NOT supported in BFF mode
export const LIVE_SESSION_NOT_SUPPORTED = true;

export function connectLiveSession(): never {
  throw new Error('Live audio sessions are not supported in secure BFF mode. This feature requires direct WebSocket connections which cannot be securely proxied.');
}

// Audio utilities (kept for potential future use, but Live API is disabled)
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const val = Math.max(-1.0, Math.min(1.0, data[i]));
    int16[i] = val < 0 ? val * 32768 : val * 32767;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}
