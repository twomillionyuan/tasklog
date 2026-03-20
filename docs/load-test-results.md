# Load Test Results

Target: `https://ecb8e1cf30.apps.osaas.io`

Method:

- `npm run load:test`
- Endpoint set: `/health` and authenticated `GET /api/spots`
- Concurrency set: `10`, `50`, `100`
- Runtime monitoring: `get-my-app`, `get-my-app-logs`, `diagnose-my-app`

## Results

### `/health`

| Concurrency | Success | Errors | Avg ms | P50 ms | P95 ms | Max ms |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 10/10 | 0 | 42.36 | 41.96 | 46.50 | 46.50 |
| 50 | 50/50 | 0 | 54.96 | 57.55 | 78.27 | 79.63 |
| 100 | 100/100 | 0 | 96.58 | 62.32 | 178.48 | 183.92 |

### `GET /api/spots`

| Concurrency | Success | Errors | Avg ms | P50 ms | P95 ms | Max ms |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 10/10 | 0 | 115.67 | 120.61 | 134.43 | 134.43 |
| 50 | 50/50 | 0 | 137.28 | 135.99 | 165.60 | 169.38 |
| 100 | 100/100 | 0 | 261.72 | 256.79 | 327.39 | 339.33 |

## MCP Monitoring Summary

- `get-my-app` reported the app as `running` during the test.
- `diagnose-my-app` reported no issues.
- `get-my-app-logs` showed no new error lines during the load run.

## Takeaways

- The single-instance app handled short bursts of 100 concurrent requests without errors.
- Authenticated list queries scaled less gracefully than `/health`, but remained stable.
- The dominant platform friction during this phase was deployment caching rather than runtime request handling.
