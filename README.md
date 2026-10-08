<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/797b44e5-ba4c-4716-80e3-4d3656a5fbc4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and set `GEMINI_API_KEY` there. The Vite server reads that value. It is not injected into browser code, and it must not use a `VITE_` prefix.
3. Run the app:
   `npm run dev`

The dev server listens on `127.0.0.1:3000`. Chat, image, and JSON calls go to same-origin `/api/gemini/*` routes. Live voice still connects from the browser to Gemini, using a short-lived token from `/api/gemini/live-token`.

Local `npm run dev` serves those routes with Vite middleware. That middleware is not the production backend. Cloudflare Pages serves the same routes from `functions/api/gemini/[[path]].ts`. `GEMINI_API_KEY` is a Pages secret binding and must not use a `VITE_` prefix.

Pages generation calls are limited to 30 per minute, and live-token calls to 6 per minute, per connecting IP. Cloudflare applies that limit separately in each location, and the counters are eventually consistent, so this is not a global spend cap. The Vite process keeps its own in-memory counters for local development only. A missing limit binding fails closed. A static host without these Pages Functions does not serve the API.
