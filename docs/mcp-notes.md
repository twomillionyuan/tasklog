# MCP Notes

This file records the OSC MCP calls used for TaskLog and what they proved.

Legacy note: some OSC resource names below still contain `spotlog` because those were the names used when the backing services were first created.

## Discovery

- `list-service-categories`
- `list-available-services { category: "database" }`
- `list-available-services { category: "storage" }`
- `get-service-schema { serviceId: "apache-couchdb" }`
- `get-service-endpoints { serviceId: "apache-couchdb" }`
- `list-my-services`
- `list-my-apps`
- `list-my-domains`
- `get-my-plan`

## Infrastructure Verification

- `list-service-instances { serviceId: "birme-osc-postgresql" }`
- `list-service-instances { serviceId: "minio-minio" }`
- `list-service-instances { serviceId: "eyevinn-app-config-svc" }`
- `list-service-instances { serviceId: "valkey-io-valkey" }`
- `get-instance-status { serviceId: "birme-osc-postgresql", name: "spotlogdb" }`
- `get-instance-status { serviceId: "minio-minio", name: "spotlogbucket" }`
- `get-instance-status { serviceId: "eyevinn-app-config-svc", name: "spotlogconfig" }`
- `list-parameters { parameterStore: "spotlogconfig" }`

## Application Operations

- `get-my-app { appId: "tasklogbackend" }`
- `diagnose-my-app { appName: "tasklogbackend" }`
- `get-my-app-logs { appId: "tasklogbackend", tail: 80 }`
- `restart-my-app { appId: "tasklogbackend" }`
- `restart-my-app { appId: "tasklogbackend", rebuild: true }`

## Config-Switch Exercise

- `setup-parameter-store { name: "spotlogconfigb" }`
- `list-service-instances { serviceId: "eyevinn-app-config-svc" }`
- `list-service-instances { serviceId: "valkey-io-valkey" }`
- `set-parameter { parameterStore: "spotlogconfigb", ... }`
- `update-my-app-config { appId: "tasklogbackend", configService: "spotlogconfigb" }`
- `update-my-app-config { appId: "tasklogbackend", configService: "spotlogconfig" }`
- `delete-service-instance { serviceId: "eyevinn-app-config-svc", name: "spotlogconfigb" }`
- `delete-service-instance { serviceId: "valkey-io-valkey", name: "spotlogconfigb" }`

## Storage Integration

- Existing MinIO-backed bucket reused for TaskLog image attachments.
- `list-objects-on-bucket { bucketName: "spotlog-media", recursive: true }`
- Result: tool failed with `Failed to get Minio instance`, even though attachment upload and display work through the application.

## Catalog Service Integration

- `create-service-instance { serviceId: "apache-couchdb", config: { name: "spotlogcouch", AdminPassword: "Spotlogcouch123" } }`
- `get-instance-status { serviceId: "apache-couchdb", name: "spotlogcouch" }`
- `describe-service-instance { serviceId: "apache-couchdb", name: "spotlogcouch" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_URL", value: "https://ebba-spotlogcouch.apache-couchdb.auto.prod.osaas.io" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_USER", value: "admin" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_PASSWORD", value: "Spotlogcouch123" }`
- `set-parameter { parameterStore: "spotlogconfig", key: "COUCHDB_DATABASE", value: "tasklogactivity" }`

## Backup / Restore Attempt

- `create-backup { serviceId: "birme-osc-postgresql", instanceName: "spotlogdb" }`
- Result: rejected on the `FREE` plan. This blocks the assignment's MCP-only backup/restore requirement.

## Notes

- TaskLog uses the same OSC stack throughout: Postgres, bucket storage, parameter store, managed app, domain, and one catalog service.
- `setup-parameter-store` timed out for `spotlogconfigb`, but the service instances were actually created. The timeout is itself a useful DX finding.
- `apache-couchdb` has no OpenAPI spec in OSC today, so integration required direct HTTP usage instead of `call-service-endpoint`.
- `restart-my-app` with `rebuild: true` was required after the runner reused a broken dependency cache. After the root build script and lockfile were fixed, normal restarts were sufficient again.
