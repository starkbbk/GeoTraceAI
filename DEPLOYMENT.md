# GeoTrace AI Deployment

## Local

1. Copy `.env.example` to `.env.local`.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

The app works without external keys by using deterministic local correlation and disabled placeholders. Add API keys to enable live OpenAI, Gemini, DeepSeek, GitHub, HIBP, and Turnstile integrations.

## PostgreSQL

The current API uses an in-memory store for local demo speed. For production, wire `lib/db/memory-store.ts` to Prisma models from `prisma/schema.prisma`.

Commands:

```bash
npm run db:generate
npm run db:push
```

## Redis and Queue System

Use Redis for:

- distributed rate limiting
- search result caching
- BullMQ investigation jobs
- bulk search queue state

Suggested queues:

- `investigation.create`
- `connector.lookup`
- `ai.correlate`
- `report.export`

## Vercel

1. Create a PostgreSQL database and Redis provider.
2. Set environment variables from `.env.example`.
3. Deploy the Next.js app.
4. Use a background worker host for long-running bulk search and PDF export jobs.

## Railway

1. Add PostgreSQL and Redis services.
2. Set `DATABASE_URL`, `REDIS_URL`, and provider keys.
3. Deploy from the repository.
4. Run Prisma migration/generation as a deploy step.

## Security Checklist

- Replace `JWT_SECRET`.
- Configure Cloudflare Turnstile.
- Protect `/admin` with Clerk or enterprise SSO.
- Move rate limiting to Redis.
- Log audit events to PostgreSQL.
- Review jurisdiction-specific data sources before enabling voter, phone reputation, or company registry connectors.
- Keep face similarity disabled unless legal basis and consent are documented.
