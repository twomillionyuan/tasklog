# TaskLog Assignment Checklist

This checklist tracks the current `TaskLog` app and the OSC/MCP capabilities it exercises through task-management features.

## Status

| Phase | Status | Notes |
|---|---|---|
| 1. MCP-driven infrastructure | Mostly complete | OSC services are documented and verified through MCP. Backup/restore remains blocked by plan limits. |
| 2. Deploy backend API via MCP | Complete | Live OSC My App is running and managed through MCP. |
| 3. Database integration | Partial | Postgres persistence and config flow are complete. Backup/restore is still blocked on `FREE`. |
| 4. Mobile app | Complete | Expo app runs against the OSC backend on iOS and Android. |
| 5. File storage via OSC buckets | Complete with MCP caveat | Task image attachments upload and render through OSC storage. MCP object listing still fails. |
| 6. Catalog service integration | Complete | CouchDB activity feed is integrated as a catalog service. |
| 7. Authentication | Complete | API auth, protected routes, SecureStore token storage, and per-user data are implemented. |
| 8. Production readiness via MCP | Complete | Domain, diagnostics, logs, restart, and config-service exercises are documented. |
| 9. Stress testing and limits | Complete | Load-test script and results target current TaskLog endpoints. |
| 10. Final report and proposals | Complete | Final report, MCP notes, architecture, and feedback log are present. |

## Remaining External Blockers

- PostgreSQL backup/restore through MCP is blocked by the OSC `FREE` plan.
- `list-objects-on-bucket` still fails for the working MinIO bucket, so storage inspection through MCP is not fully usable.
