# Deployment Prep

This project is prepared for OSC app deployment with a Node.js runtime.

## Verified Constraints

- The API already respects `process.env.PORT` and defaults to `8080`.
- OSC Web Runner injects `PORT` at runtime, so the fallback only matters locally.
- The OSC deployment tutorial states that app names should be alphanumeric only.
- OSC Web Runner documentation states that `ConfigService` should be the name of the Application Config Service instance.
- For private GitHub repositories, OSC documentation states that a GitHub personal access token is needed.
- OSC Web Runner can also inject `APP_URL` and `AUTH_URL` automatically if they are not already set in the parameter store.

## Current Deployable API

The API currently exposes:

- `GET /health`
- `GET /api/items`
- `POST /api/items`
- `GET /api/items/:id`
- `DELETE /api/items/:id`

## Recommended App Name

Use `tasklogbackend` for the OSC app name to avoid the alphanumeric naming constraint.

## Next Deployment Steps

1. Create or connect a GitHub repository for this project.
2. Provision the OSC parameter store and other services through MCP.
3. Deploy the API with `create-my-app`.
4. Bind the config service name in `configService`.
5. Verify with `get-instance-status` and `get-my-app-logs`.
