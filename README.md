# TaskLog

TaskLog is a private to-do list mobile app built with Expo React Native and an OSC-managed backend provisioned through MCP.

This repo implements the MCP-first OSC assignment shape with a task-management product:

- Expo mobile app
- OSC My App Node.js API
- OSC PostgreSQL for users, lists, and tasks
- OSC MinIO bucket for task image attachments
- OSC Application Config Service for runtime config
- OSC CouchDB catalog service for synced activity history

## Monorepo Structure

- `mobile/` Expo React Native app
- `api/` Node.js REST API
- `docs/` architecture, MCP notes, final report, and load-test results
- `feedback-log.md` running OSC/MCP friction log
- `scripts/` utilities such as the load-test runner

## Current Scope

- Private user accounts with JWT auth
- Postgres-backed task lists and tasks
- Image attachments uploaded from mobile to OSC storage through the API
- CouchDB-backed activity feed for task/list events
- iOS and Android Expo validation
- MCP-managed deployment, diagnostics, config, domain, and service operations

## Local Development

API:

```bash
DATABASE_URL=... \
JWT_SECRET=... \
S3_ENDPOINT_URL=... \
S3_ACCESS_KEY_ID=... \
S3_SECRET_ACCESS_KEY=... \
S3_BUCKET_NAME=... \
COUCHDB_URL=... \
COUCHDB_USER=... \
COUCHDB_PASSWORD=... \
COUCHDB_DATABASE=... \
npm --prefix api run start
```

Mobile:

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npx expo start --ios
```

Load test:

```bash
npm run load:test
```
