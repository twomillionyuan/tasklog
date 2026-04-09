# TaskSnap Phase 10 Final Report

Date: 2026-04-09

## Summary

I completed the OSC MCP-first assignment by building `TaskSnap`, a mobile to-do app in Expo with an OSC backend.

The final stack uses:

- OSC My Apps for the Node.js API
- PostgreSQL for app data
- OSC storage for task photos
- parameter store for config
- CouchDB as the catalog-service integration for activity history

Final live backend:

- `https://tasklogbackend.apps.osaas.io`

The app was developed on iOS first, tested on Android, and deployed through OSC workflows driven by MCP.

## What Was Built

TaskSnap lets a user:

- register and log in
- create multiple task lists
- add tasks with urgency and due dates
- reorder lists
- add an optional before photo when creating a task
- complete a task by adding an after photo
- view activity history and progress stats

## Assignment Status

| Phase | Status | Notes |
|---|---|---|
| 1 | Complete | Infrastructure provisioned through MCP. |
| 2 | Complete | API deployed and managed on OSC. |
| 3 | Complete | Postgres-backed CRUD, config flow, backup, and restore tested. |
| 4 | Complete | Expo app works on iOS and Android. |
| 5 | Complete | Task photos upload to OSC storage and render in the app. |
| 6 | Complete | CouchDB integrated for activity history. |
| 7 | Complete | Auth, protected routes, SecureStore token storage, and per-user data are in place. |
| 8 | Complete | Domain, logs, diagnostics, restart/config flows, and architecture documentation were covered. |
| 9 | Complete | Load testing completed for current app endpoints. |
| 10 | Complete | Final report, checklist, presentation brief, and feedback log are included. |

## Main Findings

### What Worked Well

- MCP made it fast to provision infrastructure without switching to the web UI.
- OSC’s open-source service model was flexible enough for a real mobile backend.
- Reprovisioning the stack in a second team showed that the setup was repeatable.
- My Apps was usable for a real Node backend once the deploy scripts were adjusted.

### Main Friction

- Long-running MCP operations were hard to interpret because completion state was not always clear.
- My Apps build and cache behavior was hard to debug.
- Domain routing was inconsistent during the OpenEvents verification run.
- OSC does not yet have a strong out-of-the-box mobile BaaS path for auth and realtime features.

## Top 5 Improvements

1. Make long-running MCP operations return clear job states.
2. Improve My Apps build and cache diagnostics.
3. Fix managed-domain routing issues.
4. Offer a more complete mobile auth and sync path.
5. Improve service endpoint discovery and schema consistency.

## Final Assessment

TaskSnap shows that OSC can support a full MCP-first mobile app workflow: provisioning, deployment, storage, configuration, auth, and operations.

The main gaps are not basic infrastructure. The main gaps are visibility, debugging, and mobile-focused platform ergonomics.
