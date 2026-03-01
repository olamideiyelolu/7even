# 7even API

NestJS + MongoDB backend for weekly matching, recommendations, and realtime chat.

## Endpoint Overview

Base prefix: `/api`

### Auth
- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### User Profile
- `GET /me`
- `PATCH /me`
- `DELETE /me`

### Quiz
- `GET /quiz/questions`
- `POST /quiz/responses`
- `GET /quiz/result`

### Matching
- `GET /matches/current`
- `GET /matches/history`
- `POST /matches/:matchId/block`
- `POST /matches/:matchId/report`

### Recommendations
- `GET /matches/:matchId/suggestions`
  - Uses static weekly Chicago dataset + catalog fallback

### Chat
- `GET /matches/:matchId/messages?cursor=<ObjectId>`
- `POST /matches/:matchId/messages`
- `POST /matches/:matchId/messages/read`

### Internal Scheduler (service token)
- `POST /scheduler/run-weekly`
- `POST /scheduler/expire-matches`

## Socket Events

Client emit:
- `chat:join`
- `chat:send`
- `chat:read`
- `chat:typing`

Server emit:
- `chat:new`
- `chat:delivered`
- `chat:read`
- `chat:typing`

## Local Run

1. `npm install`
2. `cp .env.example .env`
3. `npm run start:dev`
4. Seed catalog: `npm run seed:venues`
