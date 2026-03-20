import { performance } from "node:perf_hooks";

const baseUrl = process.env.SPOTLOG_BASE_URL ?? "https://ecb8e1cf30.apps.osaas.io";
const email = process.env.SPOTLOG_EMAIL ?? "ebba@example.com";
const password = process.env.SPOTLOG_PASSWORD ?? "secret12";
const levels = [10, 50, 100];

function percentile(sortedValues, target) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(target * sortedValues.length) - 1)
  );

  return sortedValues[index];
}

async function login() {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.token;
}

async function hitEndpoint(path, token) {
  const startedAt = performance.now();

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : undefined
    });

    const durationMs = performance.now() - startedAt;
    return {
      ok: response.ok,
      status: response.status,
      durationMs
    };
  } catch {
    return {
      ok: false,
      status: 0,
      durationMs: performance.now() - startedAt
    };
  }
}

async function runLevel(concurrency, path, token) {
  const results = await Promise.all(
    Array.from({ length: concurrency }, () => hitEndpoint(path, token))
  );

  const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
  const successCount = results.filter((result) => result.ok).length;

  return {
    concurrency,
    path,
    total: results.length,
    successCount,
    errorCount: results.length - successCount,
    avgMs: durations.reduce((sum, value) => sum + value, 0) / durations.length,
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    maxMs: durations.at(-1) ?? 0
  };
}

async function main() {
  const token = await login();
  const scenarios = [
    { path: "/health", token: null },
    { path: "/api/spots", token }
  ];

  for (const scenario of scenarios) {
    for (const concurrency of levels) {
      const result = await runLevel(concurrency, scenario.path, scenario.token);
      console.log(JSON.stringify(result));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
