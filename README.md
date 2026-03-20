# SpotLog

SpotLog is a location-based photo journal mobile app built with Expo React Native and an OSC-managed backend provisioned through MCP.

## Monorepo Structure

- `mobile/` Expo React Native app
- `api/` Node.js REST API
- `docs/` architecture and MCP notes
- `feedback-log.md` running log of OSC/MCP friction points
- `scripts/` project utilities such as the load-test runner

## Current Scope

- Private user accounts with JWT auth
- Postgres-backed spot storage
- OSC MinIO-backed image upload
- iOS-first Expo mobile client
- Automatic mobile sync polling every 10 seconds
- CouchDB activity log integration through OSC catalog services
- MCP-managed deployment, diagnostics, config, and domain operations

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
COUCHDB_DATABASE=spotlogactivity \
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
