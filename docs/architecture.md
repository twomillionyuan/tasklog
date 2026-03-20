# SpotLog Architecture

```mermaid
flowchart LR
  MCP["Claude Code + OSC MCP"] --> OSC["Open Source Cloud"]
  Mobile["Expo React Native App"] --> API["SpotLog API (Node.js My App)"]
  API --> PG["PostgreSQL"]
  API --> S3["MinIO Bucket (spotlog-media)"]
  API --> Couch["CouchDB Activity Log"]
  OSC --> API
  OSC --> PG
  OSC --> S3
  OSC --> Couch
  OSC --> Config["Parameter Store (spotlogconfig)"]
  Config --> API
```

## Notes

- The mobile app talks only to the SpotLog API.
- The API owns authentication, Postgres CRUD, image upload, and CouchDB activity mirroring.
- OSC MCP is the management layer for app restart, diagnostics, service provisioning, config changes, and domain management.
- Local testing uses the same API code path with OSC-backed service credentials injected as environment variables.
