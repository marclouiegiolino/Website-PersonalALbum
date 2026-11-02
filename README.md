# Our Love Story (Next.js frontend for Website-PersonalALbum)

Backend: https://github.com/marclouiegiolino/Website-PersonalALbum

## Run
1. Backend: `cp .env.example .env`, set `SERVICE_SECRET`, then `npm i && npx prisma db push && npm run db:seed && npm run dev` (port 4000).
2. Frontend: `cp .env.example .env.local`, set `API_URL` and the **same** `SERVICE_SECRET`, then `npm i && npm run dev`.
3. Sign in with a backend account (seed: `marc` / `changeme123`, `micaela` / `changeme456`).
   Change `CORS_ORIGIN` in the backend only if you call it from a browser directly; this app never does.

## How it maps to the backend
The browser only talks to `/api/*` on this app. `app/api/[...path]/route.ts` forwards to the backend's `/api/*`,
adding `X-Service-Secret` server-side and passing the `session_token` HttpOnly cookie through.

| Frontend need | Backend route |
| --- | --- |
| sign in / out / session | `POST /api/auth/login {username,password}`, `POST /api/auth/logout`, `GET /api/auth/me` |
| find/create the album | `GET /api/albums`, `POST /api/albums` (title **Our Love Story**) |
| load / save the layout + text | `GET /api/albums/:id`, `PATCH /api/albums/:id` (JSON stored in `description`, prefix `OLS1:`) |
| upload a photo | `POST /api/photos/upload/:albumId` (field `photo`) |
| show a photo | `GET /api/photos/:id` (stored in the document as `/photos/:id`) |

Sharing: the album is created by whoever saves first. To let the other account edit it, an owner calls
`POST /api/albums/:id/permissions {"userId": "...", "permission": "edit"}` (owners see all albums automatically).
