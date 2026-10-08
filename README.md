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

The dev server listens on `127.0.0.1:3000`. Chat, image, and JSON calls go to same-origin `/api/gemini/*` routes. Live voice still connects from the browser to Gemini, using a short-lived token from `/api/gemini/live-token`. A static build has no Gemini backend; those routes exist only while the Vite server is running.
