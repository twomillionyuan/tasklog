# MCP Notes

This file records the OSC MCP calls used for SpotLog and what they proved.

## Discovery

- `list-service-categories`
- `list-available-services { category: "database" }`
- `get-service-schema { serviceId: "apache-couchdb" }`
- `get-service-endpoints { serviceId: "apache-couchdb" }`
- `list-my-services`
- `list-my-apps`
- `list-my-domains`
- `get-my-plan`

## Existing Infrastructure Verification

- `list-service-instances { serviceId: "birme-osc-postgresql" }`
- `list-service-instances { serviceId: "minio-minio" }`
- `list-service-instances { serviceId: "eyevinn-app-config-svc" }`
- `list-service-instances { serviceId: "valkey-io-valkey" }`
- `get-instance-status { serviceId: "birme-osc-postgresql", name: "spotlogdb" }`
- `get-instance-status { serviceId: "minio-minio", name: "spotlogbucket" }`
- `get-instance-status { serviceId: "eyevinn-app-config-svc", name: "spotlogconfig" }`
- `list-parameters { parameterStore: "spotlogconfig" }`

## Application Operations

- `get-my-app { appId: "spotlogbackend" }`
- `diagnose-my-app { appName: "spotlogbackend" }`
- `get-my-app-logs { appId: "spotlogbackend", tail: 80 }`
- `restart-my-app { appId: "spotlogbackend" }`
- `restart-my-app { appId: "spotlogbackend", rebuild: true }`

## Catalog Service Integration

- `create-service-instance { serviceId: "apache-couchdb", config: { name: "spotlogcouch", AdminPassword: "Spotlogcouch123" } }`
- `get-instance-status { serviceId: "apache-couchdb", name: "spotlogcouch" }`
- `describe-service-instance { serviceId: "apache-couchdb", name: "spotlogcouch" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_URL", value: "https://ebba-spotlogcouch.apache-couchdb.auto.prod.osaas.io" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_USER", value: "admin" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_PASSWORD", value: "Spotlogcouch123" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_DATABASE", value: "spotlogactivity" }`

## Config-Switch Exercise

- `setup-parameter-store { name: "spotlogconfigb" }`
- `list-service-instances { serviceId: "eyevinn-app-config-svc" }`
- `list-service-instances { serviceId: "valkey-io-valkey" }`
- `set-parameter { parameterStore: "spotlogconfigb", ... }`
- `update-my-app-config { appId: "spotlogbackend", configService: "spotlogconfigb" }`
- `update-my-app-config { appId: "spotlogbackend", configService: "spotlogconfig" }`
- `delete-service-instance { serviceId: "eyevinn-app-config-svc", name: "spotlogconfigb" }`
- `delete-service-instance { serviceId: "valkey-io-valkey", name: "spotlogconfigb" }`

## Backup / Restore Attempt

- `create-backup { serviceId: "birme-osc-postgresql", instanceName: "spotlogdb" }`
- Result: rejected on the `FREE` plan. This blocks the assignment's MCP-only backup/restore requirement.

## Storage Inspection Attempt

- `list-objects-on-bucket { bucketName: "spotlog-media", recursive: true }`
- Result: tool failed with `Failed to get Minio instance`, even though the bucket-backed upload flow works from the app.

## Notes

- `setup-parameter-store` timed out for `spotlogconfigb`, but the service instances were actually created. The timeout is itself a useful DX finding.
- `apache-couchdb` has no OpenAPI spec in OSC today, so integration required direct HTTP usage instead of `call-service-endpoint`.
- `restart-my-app` with `rebuild: true` was required after the runner reused a broken dependency cache. After the root build script and lockfile were fixed, normal restarts were sufficient again.
