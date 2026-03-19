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
