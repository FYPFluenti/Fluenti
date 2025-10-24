<!--
Fluenti — copilot instructions for AI coding agents.
Keep this file short and actionable. Update when the server/client structure changes.
-->

# Copilot / AI Agent Quick Guide

This project is a full-stack Node+React app with a separate Python therapy service. Use these notes to be effective quickly.

- Big picture
  - Frontend: `client/` (Vite + React + TypeScript). Entry: `client/src/main.tsx` and `client/index.html`.
  - Backend: `server/` (Node + Express + TypeScript). Entry: `server/index.ts` registers routes from `server/routes.ts`.
  - External AI service: a Python therapy microservice expected at `http://localhost:5001` (used by `/api/therapy/*`, `/api/emotional-support*`).

- Important files to modify or inspect
  - `package.json` — scripts: `npm run dev` (starts server via `tsx server/index.ts`), `build`, and `build:frontend` (Vite). Use `npm run dev` for development.
  - `server/index.ts` — app setup, CORS, UTF-8 hints, Vite integration in development.
  - `server/routes.ts` — main API surface: auth, onboarding, speech, emotional-support, therapy, WebSocket at `/ws`. Many service integrations and fallback chains live here.
  - `server/*services*/` — STT/TTS and therapy-related logic (e.g. `services/speechService`, `services/fastSTTService`, `services/ttsService`, `services/enhancedTTSService`, `services/groqSpeechService`). Prefer editing logic inside services rather than deeply in `routes.ts`.
  - `server/mongoStorage.ts` — database access helpers used across routes.
  - `shared/schema.ts` — shared TypeScript shapes used by client & server.

- Key conventions & patterns
  - Single port app: server serves API and client; development uses Vite for frontend (see `server/vite.ts` for dev middleware). Only modify Vite setup in `server/vite.ts` and `vite.config.ts` when changing HMR behavior.
  - Authentication: cookie-based access/refresh tokens set as httpOnly cookies. Routes use `tokenBasedAuth` / `extractAndValidateJWT` middleware found in `server/middleware.ts`.
  - Audio processing fallbacks: routes call a prioritized chain: `fastTranscribeAudio` -> local `transcribeAudio` -> `simpleTranscribeAudio`. Preserve this chain when changing STT behavior.
  - Therapy integration: Node forwards chat/voice requests to the Python service and expects JSON fields: `response`, `sessionId`, `userId`, `sessionKey`, `crisisLevel`, `isCrisis`, `newSession`.
  - WebSocket: path `/ws` implemented in `server/routes.ts` using `ws`. Auth may be provided via query param `?token=` or Authorization header or by sending an `auth` message after connect.

- Developer workflows (exact commands)
  - Install: `npm install`
  - Dev (Node server with Vite in prod/dev mode): `npm run dev` (runs `tsx server/index.ts`). Set `.env` for `PORT`, `MONGODB_URI`, `OPENAI_API_KEY`, and HF-related envs.
  - Frontend only dev: `npm run dev:frontend` (runs Vite on port 3000).
  - Build frontend: `npm run build:frontend` (Vite build). Full build: `npm run build`.
  - Start production backend (after build): `npm run start`.

- Notes for safe edits
  - Prefer updating small service modules under `server/services/` over editing the large `routes.ts` file when possible.
  - Keep the STT fallback order and therapy service contract intact to avoid silent regressions in speech/therapy flows.
  - When changing auth, update cookie behavior in `server/routes.ts` where cookies are set on login/signup, and update `server/middleware.ts` accordingly.

- Quick examples (search & replace tips)
  - To find therapy calls: search `http://localhost:5001/api/therapy` or `generateSmartTTS`.
  - To add a new API route that needs auth: register it in `routes.ts` and protect it with `tokenBasedAuth` (imported near the top).

- Integration & testing tips
  - Python therapy service must run on port 5001 for local dev; the Node server will fail to get therapy responses but provides safe fallbacks. If you change the Python service port, update all `fetch('http://localhost:5001/...')` calls in `server/routes.ts`.
  - WebSocket QA: connect to `ws://localhost:<PORT>/ws` and send a JSON auth message: {"type":"auth","data":{"token":"<userIdOrToken>"}}.

If anything here is unclear or you'd like more examples (code snippets showing a typical change), tell me which area to expand and I'll iterate.  
