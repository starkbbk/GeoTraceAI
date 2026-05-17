# GeoTrace AI

GeoTrace AI is a modern full-stack OSINT web application scaffold for authorized public-source investigations. It accepts partial identifiers, normalizes regional formats, queries legal public connectors, correlates evidence, and renders an analyst dashboard with location intelligence, digital footprint, risk scoring, AI summaries, relationship graph, and audit metadata.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn-style local UI primitives
- Leaflet + OpenStreetMap
- Prisma schema for PostgreSQL
- Redis-ready rate limiting and queue design
- OpenAI, Gemini, and DeepSeek adapter layer

## Pages

- `/` landing and smart search console
- `/dashboard` analytics and recent investigations
- `/results/demo` demo intelligence dashboard
- `/docs` API documentation
- `/admin` admin preview and audit log

## Public Connectors

Implemented:

- OpenStreetMap Nominatim
- GitHub REST API
- Gravatar hash/profile link generation
- Have I Been Pwned breach count when `HIBP_API_KEY` is configured
- Manual public search review links

Disabled or review-gated by design:

- face similarity search
- Truecaller-like phone metadata
- voter record aggregation
- leaked/private databases
- automated search result scraping

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` and run a search, or open `/results/demo`.

## Environment

See `.env.example`.

Important keys:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `GITHUB_TOKEN`
- `HIBP_API_KEY`
- `PUBLIC_API_CONTACT_EMAIL`
- `TURNSTILE_SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`

## API

Create a search:

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Aarav Sharma",
    "pincode": "226001",
    "country": "India",
    "username": "aaravdev",
    "authorizationAccepted": true
  }'
```

Fetch a result:

```bash
curl http://localhost:3000/api/search/{id}
```

## Production Notes

This scaffold uses an in-memory store so it can run immediately. Move `lib/db/memory-store.ts` to Prisma-backed persistence for production using `prisma/schema.prisma`.

Use Redis for distributed throttling, caching, and BullMQ jobs. Protect `/admin` with Clerk, SSO, or your auth provider before exposing it.

## Responsible Use

GeoTrace AI is built for authorized public-source research. It does not access private databases, leaked passwords, paywalled personal data, or bypass authentication. Jurisdiction-specific sources must be reviewed before enabling.
