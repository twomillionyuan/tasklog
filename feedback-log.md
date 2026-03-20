# Feedback Log

Use this file during the assignment to capture OSC and MCP friction in the moment.

## Entry Template

### Date
YYYY-MM-DD

### Task
What you were trying to do.

### MCP Tool
Tool name used.

### Expected
What you thought would happen.

### Actual
What actually happened.

### Friction
What was confusing, missing, slow, or broken.

### Workaround
How you got unstuck.

### Improvement Idea
What OSC or MCP should improve.

## Entry

### Date
2026-03-19

### Task
Provision PostgreSQL through the OSC CLI.

### MCP Tool
`osc create birme-osc-postgresql`

### Expected
The option names in docs and the actual service schema would match.

### Actual
`username/password/database` failed. The live service required `PostgresUser/PostgresPassword/PostgresDb`.

### Friction
The naming mismatch cost time and forced schema spelunking.

### Workaround
Used the generated SDK docs to inspect the actual config type for `birme-osc-postgresql`.

### Improvement Idea
Expose the schema directly in CLI help or make the docs match the live service.

## Entry

### Date
2026-03-19

### Task
Bind Application Config Service to a Web Runner app.

### MCP Tool
`osc web config-create`, `osc myapp create --config-service`

### Expected
Creating the app with a config service would be enough for the container to start.

### Actual
The Web Runner referenced `{{secrets.oscrefreshtoken<appname>}}` and failed with `CreateContainerConfigError` until that secret existed.

### Friction
The missing secret dependency was implicit and not surfaced by app creation.

### Workaround
Created the missing service secret manually with `osc secrets create eyevinn-web-runner oscrefreshtokenspotlogbackend ...`.

### Improvement Idea
Auto-create the required refresh-token secret or return an actionable error during app creation.

## Entry

### Date
2026-03-19

### Task
Deploy a TypeScript Node app from a monorepo.

### MCP Tool
`osc myapp create`, `osc restart eyevinn-web-runner`

### Expected
Build and start phases would either both use the same dependency mode or clearly document production-only install behavior.

### Actual
OSC ran the `build` step without all type packages installed, then still launched `start`. The app worked only after changing `start` to run `tsx` directly and moving type packages needed by `tsc`.

### Friction
It was not obvious which dependencies are present during build vs runtime.

### Workaround
Inspected live logs, moved runtime-critical tooling into regular dependencies, and redeployed.

### Improvement Idea
Document the exact install/build/start lifecycle and whether devDependencies are excluded.

## Entry

### Date
2026-03-19

### Task
Recreate an app with the same name after deletion.

### MCP Tool
`osc myapp remove`, `osc myapp create`

### Expected
Once an app disappeared from `myapp list`, the name would be available again.

### Actual
The wrapper said the app was gone, but `myapp create` still reported `Name is already taken`.

### Friction
Name reservation and deletion timing were unclear.

### Workaround
Created a fresh app name, `spotlogbackend`, and repointed the mobile app to the new DNS.

### Improvement Idea
Show deletion progress explicitly and surface when a name is still reserved by underlying service state.

## Entry

### Date
2026-03-20

### Task
Create a PostgreSQL backup through OSC MCP.

### MCP Tool
`create-backup`

### Expected
The tool would create a development backup so Phase 3 backup/restore could be exercised end to end.

### Actual
OSC rejected the call because backups require a paid plan.

### Friction
The capability exists in MCP but is not usable for this assignment on a free account, which makes the phase impossible to complete as written.

### Workaround
None through MCP on this plan.

### Improvement Idea
Allow at least manual development backups on the free tier, or surface the plan restriction earlier in assignment-oriented docs.

## Entry

### Date
2026-03-20

### Task
Inspect uploaded objects in the SpotLog storage bucket through MCP.

### MCP Tool
`list-objects-on-bucket`

### Expected
The tool would return the uploaded image keys from the working MinIO bucket.

### Actual
The tool failed with `Failed to get Minio instance`.

### Friction
The application can upload and serve files successfully, but MCP inspection of the same bucket failed.

### Workaround
Used live app behavior and API responses to confirm uploads, but bucket inspection through MCP remained broken.

### Improvement Idea
Fix bucket-to-instance resolution for MinIO-backed buckets and return a more actionable error if lookup fails.

## Entry

### Date
2026-03-20

### Task
Create a second parameter store to test `update-my-app-config`.

### MCP Tool
`setup-parameter-store`

### Expected
The tool would either succeed quickly or return a progress handle.

### Actual
The MCP call timed out after 120 seconds, but the parameter store and backing Valkey instance were actually created.

### Friction
The timeout made the result ambiguous and forced manual verification through follow-up MCP calls.

### Workaround
Checked `list-service-instances` for both `eyevinn-app-config-svc` and `valkey-io-valkey` to confirm the instances existed.

### Improvement Idea
Long-running provisioning calls should stream progress or return a job id instead of timing out after success.

## Entry

### Date
2026-03-20

### Task
Integrate OSC CouchDB as a catalog service for SpotLog activity logging.

### MCP Tool
`get-service-endpoints`

### Expected
The tool would expose an OpenAPI surface or enough endpoint metadata to drive integration from MCP alone.

### Actual
The service reported no OpenAPI specification, so endpoint discovery stopped at the schema level.

### Friction
CouchDB was still usable, but only by falling back to direct HTTP assumptions rather than MCP-native endpoint exploration.

### Workaround
Used `get-service-schema`, `describe-service-instance`, and direct authenticated HTTP calls to integrate the service.

### Improvement Idea
Add OpenAPI coverage or richer endpoint documentation for more catalog services, especially databases commonly used as app backends.

## Entry

### Date
2026-03-20

### Task
Redeploy the app after pushing a code change.

### MCP Tool
`restart-my-app`

### Expected
The runner would reuse cache safely or clearly indicate when the cached dependency set was stale.

### Actual
The rebuild restored cached dependencies, then failed with `tsc: not found` and `tsx: not found` until the deploy scripts and lockfile were adjusted.

### Friction
The failure mode looked like an application regression at first, but the real issue was the runner's cached workspace dependency state.

### Workaround
Forced a rebuild, changed the root deploy scripts to install the API workspace explicitly, refreshed `api/package-lock.json`, and redeployed.

### Improvement Idea
Expose dependency-cache provenance in app logs and provide a first-class cache bust option tied to workspace lockfiles.
