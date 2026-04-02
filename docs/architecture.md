# TaskLog Architecture

```mermaid
flowchart LR
  MCP["Claude Code + OSC MCP"] --> OSC["Open Source Cloud"]
  Mobile["Expo React Native App"] --> API["TaskLog API (Node.js My App)"]
  API --> PG["PostgreSQL"]
  API --> S3["MinIO Bucket (task attachments)"]
  API --> Couch["CouchDB Activity Feed"]
  OSC --> API
  OSC --> PG
  OSC --> S3
  OSC --> Couch
  OSC --> Config["Parameter Store"]
  Config --> API
```

## Notes

- The mobile app talks only to the TaskLog API.
- The API owns authentication, task/list CRUD, attachment upload, and activity mirroring.
- OSC MCP is the management layer for service provisioning, parameter-store changes, app restart, diagnostics, domain management, and service discovery.
- TaskLog exercises the same OSC capabilities required by the assignment: mobile client, managed API, database, storage, config, and catalog-service integration.
