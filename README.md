# InterviewAce API

A TypeScript Express backend that powers InterviewAce, a mock-interview companion. It provides secure user authentication, profile management with avatar uploads, and AI-assisted interview question generation backed by Google Gemini.

## Tech Stack
- Node.js 20+ with Express and TypeScript
- MongoDB with Mongoose ODM
- JWT authentication with access and refresh tokens
- Multer + Cloudinary for avatar uploads
- Google Gemini API (via Axios) for AI-generated interview questions
- Vite tooling is included for the companion frontend (`npm run frontend`).

## Features
- User registration, login, refresh tokens, and password changes
- Authenticated profile read/update endpoints with optional avatar uploads
- Role-aware middleware (`authenticate`, `requireRole`) for future admin features
- AI endpoint that generates interview questions with automatic fallback prompts if the AI service throttles or is unavailable
- Structured routing (`/api/v1/auth`, `/api/v1/ai`, `/api/v1/post`) ready for further expansion

### Environment Variables
| Name | Description |
| --- | --- |
| `PORT` | Optional. Port for the API (defaults to 5000). |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret for 30-minute access tokens. |
| `JWT_REFRESH_SECRET` | Secret for 7-day refresh tokens. |
| `GEMINI_API_KEY` | Google Gemini key for AI question generation. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name for avatars. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |

> The AI route gracefully falls back to a curated list of common interview questions when the Gemini API is unavailable or throttled; cooldowns are respected via the `retry-after` header when present.

## API Overview

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Health/welcome message. |
| `POST` | `/api/v1/auth/register` | Public | Create a USER account (firstname, lastname, email, password). |
| `POST` | `/api/v1/auth/login` | Public | Login and receive access + refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | Public | Exchange refresh token for a new access token. |
| `GET` | `/api/v1/auth/me` | Bearer | Fetch authenticated profile (password omitted). |
| `PUT` | `/api/v1/auth/me` | Bearer | Update firstname, lastname, or email (uniqueness enforced). |
| `PUT` | `/api/v1/auth/me/password` | Bearer | Change password (requires current password, validates length). |
| `POST` | `/api/v1/auth/me/avatar` | Bearer + multipart | Upload/replace avatar; previous Cloudinary image is removed if it exists. |
| `POST` | `/api/v1/ai/generate` | Public | Generate up to 20 interview questions using Gemini, with fallback list. |
| `GET` | `/api/v1/post` | Public | Placeholder route for future post resources. |

All authenticated routes require an `Authorization: Bearer <accessToken>` header. Access tokens expire after 30 minutes; use the refresh token flow to fetch a new one without re-login.

## Project Structure
```
src/
  index.ts               # Express bootstrap, Mongo connection, CORS config
  controllers/
    auth.controller.ts   # Auth, profile, password, avatar logic
    ai.controller.ts     # Gemini integration with fallback handling
  middleware/
    auth.ts              # JWT authentication middleware
    role.ts              # Role guard for future admin features
  models/
    user.model.ts        # User schema with status enum and avatar metadata
  routes/                # Versioned API routers
  utils/
    tokens.ts            # Access/refresh token helpers
    cloudinary.ts        # Cloudinary client configuration
```

## Scripts
- `npm run dev` – Start the API with `ts-node` (auto restarts via your editor/terminal of choice).
- `npm run build` – Type-check and emit JavaScript to `dist/`.
- `npm run frontend` – Optional Vite dev server if you work on the companion frontend from this repo.
- `npm run lint` – ESLint via the flat config.

## Next Steps
- Flesh out `src/routes/post.ts` with interview post resources.
- Add admin roles via `requireRole` middleware for approval workflows.
- Add an `.env.example` committed template so newcomers can bootstrap faster.
