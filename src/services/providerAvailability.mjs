export function requireServerSideProvider() {
  throw new Error('Gemini requests are disabled until an authorized server-side backend is configured.');
}
