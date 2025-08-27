# Deadticker — Twitter Bot (MVP)

Tag the bot with a $TICKER or a contract address; it replies with a tombstone image and a short epitaph.

## Setup

1) Install deps

```bash
npm install
```

2) Create `.env` from example and fill credentials

```bash
cp .env.example .env
```

Required:
- `TWITTER_APP_KEY`, `TWITTER_APP_SECRET`
- `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

Optional overrides:
- `CACHE_PREFIX`, `GLOBAL_RPS`, `USER_IMAGE_COOLDOWN_MIN`, `USER_INSTRUCTION_COOLDOWN_HOURS`

## Dev

```bash
npm run dev
```

## Build & run

```bash
npm run build
npm start
```

## Behavior
- Poll mentions timeline, filter bot mentions
- Extract $TICKER or contract; resolve contract via Dexscreener
- Render tombstone (PNG 1024×1024)
- Upload media and reply
- Rate limits (global + per-user), dedupe by tweet_id, instruction replies (24h/user)

## Notes
- Rendering uses Skia Canvas; no GPU needed
- Caching and limits use Upstash Redis 