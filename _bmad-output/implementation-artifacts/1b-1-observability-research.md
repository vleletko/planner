# Observability Research - Epic 1B

**Date:** 2025-12-08
**Author:** Dev Agent (Amelia)
**Status:** Approved

## Executive Summary

**CRITICAL FINDING:** Our production Docker uses `bun server.js` (Bun runtime), while development uses `bun run next dev` (Node.js runtime via shebang). OpenTelemetry auto-instrumentation **does NOT work with Bun runtime** due to missing `--require` and `--experimental-loader` hooks.

**Recommendation:** Change production Dockerfile to use Node.js runtime (`node server.js`) OR use manual-only instrumentation. Auto-instrumentation packages (`instrumentation-pg`, `instrumentation-undici`, `instrumentation-pino`) rely on Node.js-specific mechanisms that Bun doesn't support.

## Decision Summary Table

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Runtime** | **Node.js for production** | Auto-instrumentation requires Node.js hooks |
| SDK | `@opentelemetry/sdk-node` | Full control, no Vercel lock-in |
| Auto-instrumentation | `instrumentation-pg`, `instrumentation-undici`, `instrumentation-pino` | Works on Node.js runtime |
| Logging | `@opentelemetry/instrumentation-pino` | Preserves Pino (ADR-007), main thread SDK integration |
| Exporters | Console (dev) + OTLP/HTTP (prod) | Environment-based switching |
| Environment Config | `deployment.environment.name` resource attribute | Isolate dev/preview/staging/prod data |
| Backend | Defer - console only initially | Avoid premature infrastructure complexity |
| Collector | Direct export initially | Single-app deployment |

---

## CRITICAL: Runtime Compatibility Issue

### Current State

| Environment | Command | Runtime | Auto-Instrumentation |
|-------------|---------|---------|---------------------|
| Development | `bun run next dev` | **Node.js** (via shebang) | **Works** |
| Production (Docker) | `bun server.js` | **Bun** | **BROKEN** |

**Root Cause:** OpenTelemetry auto-instrumentation relies on:
- `--require=./tracing.cjs` (CJS preload)
- `--experimental-loader=@opentelemetry/instrumentation/hook.mjs` (ESM loader)

Bun does not support either mechanism. The OpenTelemetry JS repo labels Bun issues as "runtime:bun Unsupported Runtime Bun".

### Evidence

From [Bun GitHub Discussion #7185](https://github.com/oven-sh/bun/discussions/7185):
> "Native OpenTelemetry (traces, metrics, W3C context/OTLP) is a critical blocker for production adoption and is forcing teams to avoid Bun or build fragile workarounds."

From [Bun GitHub Issue #3775](https://github.com/oven-sh/bun/issues/3775):
> "Bun lacks support for node's --experimental-loader=@opentelemetry/instrumentation/hook.mjs"

### Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A: Use Node.js in production** | Auto-instrumentation works, consistent behavior | Slightly larger image, lose some Bun perf gains | **Recommended** |
| **B: Use `imbios/bun-node` image** | Has Node.js fallback | Larger image, less tested | Fallback option |
| **C: Manual instrumentation only** | Works on any runtime | More code, no auto-spans for pg/http | Last resort |
| **D: Keep Bun, accept limitations** | Fastest startup | No production observability | **Not acceptable** |

### Recommended Dockerfile Change

```dockerfile
# BEFORE (Bun runtime - auto-instrumentation broken)
FROM oven/bun:1.3.1-slim AS runner
CMD ["bun", "apps/web/server.js"]

# AFTER (Node.js runtime - auto-instrumentation works)
FROM node:22-slim AS runner
CMD ["node", "apps/web/server.js"]
```

**Note:** We can still use Bun for package management and building (faster), but run production server with Node.js.

---

## 7. Deployment Environment Configuration

### Environment Types

| Environment | `deployment.environment.name` | Service Instance | Use Case |
|-------------|-------------------------------|------------------|----------|
| Development | `development` | `{developer}-local` | Local dev machines |
| Preview | `preview-{PR_ID}` | `preview-{PR_ID}` | PR preview deployments |
| Staging | `staging` | `staging` | Pre-production testing |
| Production | `production` | `production` | Live users |

### Why Unique Preview Environments?

**Yes, unique preview environments are required** to avoid mixing telemetry data:
- Each PR gets its own preview deployment on Dokploy
- Without unique identifiers, traces from PR #123 and PR #456 would be indistinguishable
- Makes debugging specific PR changes possible

### Configuration Pattern

```typescript
// instrumentation.node.ts
import { Resource } from '@opentelemetry/resources'
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_SERVICE_INSTANCE_ID
} from '@opentelemetry/semantic-conventions'

function getDeploymentEnvironment(): string {
  // Production
  if (process.env.NODE_ENV === 'production' && !process.env.PREVIEW_ID) {
    return 'production'
  }

  // Preview (PR deployments)
  if (process.env.PREVIEW_ID) {
    return `preview-${process.env.PREVIEW_ID}`
  }

  // Staging
  if (process.env.STAGING === 'true') {
    return 'staging'
  }

  // Development
  return 'development'
}

function getServiceInstanceId(): string {
  if (process.env.PREVIEW_ID) {
    return `preview-${process.env.PREVIEW_ID}`
  }
  if (process.env.HOSTNAME) {
    return process.env.HOSTNAME
  }
  return `${process.env.USER || 'unknown'}-local`
}

const resource = new Resource({
  [ATTR_SERVICE_NAME]: 'planner-web',
  [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '0.0.0',
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: getDeploymentEnvironment(),
  [ATTR_SERVICE_INSTANCE_ID]: getServiceInstanceId(),
})

const sdk = new NodeSDK({
  resource,
  // ... other config
})
```

### Environment Variables Required

| Variable | Source | Example |
|----------|--------|---------|
| `NODE_ENV` | Build-time | `production` |
| `PREVIEW_ID` | Dokploy (PR number) | `123` |
| `STAGING` | Dokploy staging config | `true` |
| `APP_VERSION` | CI/CD (git tag/sha) | `1.2.3` or `abc1234` |
| `HOSTNAME` | Docker/K8s | `planner-web-abc123` |

### Sampling by Environment

```typescript
import { ParentBasedSampler, TraceIdRatioBasedSampler, AlwaysOnSampler } from '@opentelemetry/sdk-trace-node'

function getSampler() {
  const env = getDeploymentEnvironment()

  switch (env) {
    case 'production':
      // Sample 10% of traces in production
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(0.1)
      })
    case 'staging':
      // Sample 50% in staging
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(0.5)
      })
    default:
      // Always sample in dev/preview
      return new AlwaysOnSampler()
  }
}
```

---

## 1. OTEL SDK Comparison

### Options Evaluated

| Feature | `@opentelemetry/sdk-node` | `@vercel/otel` |
|---------|---------------------------|----------------|
| **Version** | 2.x (stable SDK) | 2.1.0 |
| **Maintenance** | OpenTelemetry community (CNCF) | Vercel |
| **Edge Runtime** | Not compatible | Compatible (bundles web SDK) |
| **Bundle Size** | ~300KB (reported, with deps) | Smaller (wrapper) |
| **Configuration** | Full control | Simplified, opinionated |
| **Bun Compatibility** | Partial (see below) | Unknown/untested |
| **Vercel Integration** | Manual OTLP setup | Automatic on Vercel |

### Bun Runtime Compatibility Analysis

**Critical Findings from Research:**

| Node.js API | Bun Status | Impact on OTEL |
|-------------|------------|----------------|
| `AsyncLocalStorage` | Implemented | Context propagation works |
| `AsyncResource` | Implemented | Resource tracking works |
| `async_hooks` (v8 promise hooks) | Not called | May affect some instrumentations |
| `perf_hooks.performance` | Use global `performance` instead | Minor adaptation needed |
| `perf_hooks.monitorEventLoopDelay` | Not implemented (throws in v1.2.5+) | Metrics limitation |
| `perf_hooks.createHistogram` | Not implemented | Metrics limitation |
| `diagnostics_channel` | Partial | Some auto-instrumentations may fail |

**Performance Note:** Earlier reports of 55x slowdown with AsyncLocalStorage were due to benchmarking debug builds. Release builds do not exhibit this issue.

**Community Status:** Native OpenTelemetry support is described as "a critical blocker for production adoption" in Bun. Teams are building workarounds, but official support is not yet available.

### Recommendation

**Use `@opentelemetry/sdk-node` with manual configuration.**

**Rationale:**
1. **Full control** - We can debug and work around Bun-specific issues
2. **No Vercel lock-in** - We deploy on Dokploy, not Vercel
3. **Edge not needed** - Our ORPC handlers run on Node.js runtime only
4. **Community support** - Larger ecosystem, more troubleshooting resources
5. **`@vercel/otel` untested on Bun** - No guarantee it works better

**Risk Mitigation:**
- Test SDK initialization early in Story 1B.2
- Have fallback to minimal manual spans if auto-instrumentation fails
- Monitor Bun's Node.js compatibility improvements

---

## 2. Auto-instrumentation

### Next.js 16 `instrumentation.ts`

**Location:** `apps/web/instrumentation.ts` (or `src/instrumentation.ts`)

**Capabilities:**
- Runs once on server startup (not edge, not client)
- Can be async - await SDK initialization
- Dynamic imports based on environment
- No `experimental.instrumentationHook` needed (Next.js 15+)

**Pattern:**
```typescript
// apps/web/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
}
```

**Constraints:**
- Server-only (not edge runtime, not client bundle)
- Must be in root of app/src directory
- Runs before app code loads

### Database (Drizzle/PostgreSQL)

**Package:** `@opentelemetry/instrumentation-pg` (v0.61.1)

**How it works:**
- Auto-instruments `pg` and `pg-pool` modules
- Drizzle uses `pg` under the hood - instrumentation should work
- Creates spans for SQL queries with statement text

**Alternative:** `@kubiks/otel-drizzle`
- Drizzle-specific instrumentation
- Span names: `drizzle.select`, `drizzle.insert`, etc.
- Captures operation type, SQL, db.system
- Peer deps: `@opentelemetry/api >= 1.9.0`, `drizzle-orm >= 0.28.0`

**Recommendation:** Start with `@opentelemetry/instrumentation-pg` (standard). Evaluate `@kubiks/otel-drizzle` if we need Drizzle-specific span names.

### HTTP/Fetch Instrumentation

**For Node.js `fetch()` (our case):**
- **Package:** `@opentelemetry/instrumentation-undici` (v0.19.0)
- Instruments Node.js native fetch (which uses undici internally)

**For `http`/`https` modules:**
- **Package:** `@opentelemetry/instrumentation-http`

**Note:** `@opentelemetry/instrumentation-fetch` is browser-only - does NOT work for Node.js fetch.

### ORPC Middleware for Span Creation

**Official oRPC OpenTelemetry Integration** ([docs](https://orpc.unnoq.com/docs/integrations/opentelemetry)):

oRPC v1.0 has built-in OpenTelemetry support via interceptors:

```typescript
import { trace } from '@opentelemetry/api'
import { RPCHandler } from '@orpc/server'

const handler = new RPCHandler(router, {
  interceptors: [
    ({ request, next }) => {
      const span = trace.getActiveSpan()
      request.signal?.addEventListener('abort', () => {
        span?.addEvent('aborted', { reason: String(request.signal?.reason) })
      })
      return next()
    },
  ],
})
```

**Key Points:**
- oRPC automatically creates spans for each middleware execution
- Use interceptors to add custom span attributes/events
- HTTP instrumentation handles context propagation

### Manual Span Requirements

Based on research, these will likely need manual spans:

| Area | Auto-Instrumentation | Manual Needed |
|------|---------------------|---------------|
| HTTP incoming (Next.js) | Yes (Next.js built-in) | No |
| HTTP outgoing (fetch) | Yes (`instrumentation-undici`) | No |
| PostgreSQL queries | Yes (`instrumentation-pg`) | No |
| ORPC procedures | Partial (via interceptors) | Yes - custom attributes |
| Business logic | No | Yes - critical paths |
| Error boundaries | No | Yes - Story 1B.4 |

### Bun-Specific Instrumentation Issues

**Potential Issues:**
1. Some instrumentations rely on `diagnostics_channel` - may not work
2. Auto-instrumentations bundle may have issues - use selective imports
3. `@opentelemetry/auto-instrumentations-node` may be too heavy

**Recommendation:** Use selective instrumentation packages instead of the full auto-instrumentations bundle:
```typescript
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
```

---

## 3. Logging Strategy

### Option A: `pino-opentelemetry-transport`

**How it works:**
- Pino transport mechanism (worker thread)
- Starts independent LoggerProvider in worker thread
- Parses log records, translates to OTEL Logs data model
- Sends to OTLP collector

**Pros:**
- Worker thread isolation (non-blocking)
- Preserves Pino API completely
- Direct OTLP export

**Cons:**
- Independent LoggerProvider (not main thread SDK)
- May have subtle differences in log translation
- Additional dependency

### Option B: `@opentelemetry/instrumentation-pino` (Recommended)

**How it works:**
- Auto-instrumentation on main thread
- Injects trace_id/span_id into Pino log records
- Can send logs to OpenTelemetry Logging SDK
- Uses main thread's SDK configuration

**Pros:**
- Uses main thread's SDK (unified configuration)
- Automatic trace correlation
- Part of official OpenTelemetry ecosystem
- Included in `@opentelemetry/auto-instrumentations-node`

**Cons:**
- Main thread operation (minimal perf impact with Pino 7+)

### Trace Correlation Mechanism

Both approaches support injecting trace context into logs:

```json
{
  "level": 30,
  "time": 1699574400000,
  "msg": "User login successful",
  "trace_id": "abc123...",
  "span_id": "def456...",
  "trace_flags": "01"
}
```

### Recommendation

**Use `@opentelemetry/instrumentation-pino`**

**Rationale:**
1. **Unified SDK** - Same LoggerProvider as traces
2. **Preserves Pino** - Per ADR-007, we're committed to Pino
3. **Automatic correlation** - trace_id/span_id injected automatically
4. **Official support** - Maintained by OpenTelemetry community

**Implementation Pattern (Story 1B.3):**
```typescript
// instrumentation.node.ts
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'

const sdk = new NodeSDK({
  instrumentations: [
    new PinoInstrumentation({
      // Enable log sending to OTEL
      logHook: (span, record) => {
        record['resource.service.name'] = 'planner-web'
      },
    }),
  ],
})
```

---

## 4. Exporter Strategy

### Development (Console)

**Package:** Built into `@opentelemetry/sdk-trace-node`

**Usage:**
```typescript
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
})
```

**Purpose:** Debugging, immediate feedback during development

### Production (OTLP)

**Package:** `@opentelemetry/exporter-trace-otlp-http`

**Usage:**
```typescript
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
})
```

**Configuration via Environment:**
- `OTEL_EXPORTER_OTLP_ENDPOINT` - Backend URL
- `OTEL_EXPORTER_OTLP_HEADERS` - Auth headers
- `OTEL_EXPORTER_OTLP_COMPRESSION` - gzip/none

### Environment Switching Pattern

```typescript
// instrumentation.node.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

const isDev = process.env.NODE_ENV === 'development'

const traceExporter = isDev
  ? new ConsoleSpanExporter()
  : new OTLPTraceExporter()

const sdk = new NodeSDK({
  serviceName: 'planner-web',
  traceExporter,
  // ... other config
})

sdk.start()
```

### Recommendation

**Development:** Console exporter for immediate feedback
**Production:** OTLP/HTTP exporter with BatchSpanProcessor (default)

---

## 5. Backend Options

### Self-Hosted Survey

| Backend | Type | Storage | Docker Complexity | Best For |
|---------|------|---------|-------------------|----------|
| **Jaeger** | Tracing only | Cassandra/ES | Medium-High | Quick start, tracing focus |
| **Grafana Tempo** | Tracing only | Object storage | Part of LGTM stack | Grafana ecosystem |
| **SigNoz** | Unified (L+M+T) | ClickHouse | Single backend | All-in-one open source |

**Jaeger:**
- CNCF graduated project
- Mature, well-documented
- Tracing only - need separate tools for logs/metrics
- Requires Cassandra or Elasticsearch

**Grafana Tempo:**
- Cost-efficient (object storage)
- Great if already using Grafana/Prometheus/Loki
- Part of larger LGTM stack
- TraceQL for querying

**SigNoz:**
- OpenTelemetry-native from ground up
- Single ClickHouse backend for logs, metrics, traces
- Easier self-hosting than multi-tool stacks
- Good Jaeger upgrade path

### SaaS Survey

| Service | Free Tier | Pricing | Notes |
|---------|-----------|---------|-------|
| **Grafana Cloud** | 50GB traces/month | Pay-as-you-go | Good ecosystem |
| **Honeycomb** | 20M events/month | Team plans | Excellent query experience |
| **Axiom** | 500GB/month ingest | Free tier generous | Simple, fast |

### Recommendation

**Defer backend selection. Start with console exporter only.**

**Rationale:**
1. **Avoid premature complexity** - Focus on SDK setup first
2. **Console is sufficient** for initial development
3. **Backend can be added later** without code changes (just env vars)
4. **Dokploy constraints** - Adding Jaeger/SigNoz increases Docker footprint

**When to add backend:**
- When debugging distributed issues in staging/prod
- When team needs historical trace analysis
- When console output becomes unmanageable

---

## 6. Collector Architecture

### Pattern Comparison

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Direct Export** | App → Backend | Simple, single app |
| **Agent (Sidecar)** | App → Local Collector → Backend | Host-level telemetry |
| **Gateway** | Apps → Central Collector → Backend | Multi-app, batching |
| **Agent + Gateway** | App → Agent → Gateway → Backend | Scale, HA |

### Direct Export (Recommended for Now)

```
[Next.js App] --OTLP--> [Backend]
```

**Pros:**
- Simplest setup
- No additional infrastructure
- Works with Dokploy constraints

**Cons:**
- No buffering if backend is down
- No central processing/sampling

### Recommendation for Dokploy

**Start with direct export. Add collector when needed.**

**Rationale:**
1. **Single app deployment** - No need for multi-app aggregation
2. **Minimal infrastructure** - Dokploy has resource constraints
3. **OTLP exporter has retry logic** - Built-in resilience
4. **Easy to add later** - Collector is just another Docker service

**When to add collector:**
- Multiple services need telemetry
- Need tail-based sampling
- Need telemetry processing/enrichment
- Backend goes down frequently

---

## Deferred Decisions

| Decision | Reason | Revisit When |
|----------|--------|--------------|
| Backend selection | Premature complexity | Ready to analyze traces in staging |
| Collector deployment | Single app, not needed | Multiple services or scaling |
| Metrics setup | Focus on tracing first | Story 1B.5+ |
| Tail-based sampling | Not enough volume | High trace volume |
| `@kubiks/otel-drizzle` | Standard pg instrumentation sufficient | Need Drizzle-specific spans |

## Required Actions for Story 1B.2

Based on this research, Story 1B.2 must:

1. **Change Dockerfile runtime** from `bun server.js` to `node server.js`
2. **Verify auto-instrumentation works** with Node.js standalone server
3. **Configure environment detection** for dev/preview/staging/prod
4. **Test trace context propagation** across ORPC calls

---

## ADR: Runtime Switch from Bun to Node.js

### Decision

**Switch production runtime from Bun to Node.js for the Next.js standalone server.**

### Context

- Current Dockerfile uses `oven/bun:1.3.1-slim` with `CMD ["bun", "apps/web/server.js"]`
- OpenTelemetry auto-instrumentation is a core requirement for Epic 1B
- Research confirmed Bun lacks support for Node.js hooks required by OpenTelemetry

### Change

| Component | Before | After |
|-----------|--------|-------|
| Base image | `oven/bun:1.3.1-slim` | `node:22-slim` |
| Run command | `bun apps/web/server.js` | `node apps/web/server.js` |
| Package manager | Bun (unchanged in CI) | Bun (unchanged) |
| Build process | Unchanged | Unchanged |

### Rationale

1. **Observability is non-negotiable** - Production systems require tracing
2. **Auto-instrumentation saves effort** - Manual spans for pg, http, pino would be significant work
3. **Dev/prod parity** - Development already uses Node.js (via shebang), this aligns production
4. **Bun for speed, Node for compatibility** - We keep Bun benefits during CI/build

### Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Startup time regression** | Medium | Low | Node.js 22 is fast; monitor cold starts |
| **Memory usage increase** | Low | Low | Node.js 22 has improved memory; monitor |
| **Missing native Bun APIs** | Low | Medium | We don't use Bun-specific APIs in server code |
| **Docker image size increase** | Medium | Low | `node:22-slim` is ~50MB larger; acceptable |
| **Next.js standalone compatibility** | Low | High | Next.js officially supports Node.js; test in 1B.2 |
| **CI/CD pipeline changes** | Low | Low | Only Dockerfile changes, no workflow changes |

### Verification Plan (Story 1B.2)

1. Update Dockerfile to use `node:22-slim`
2. Build and run locally with `node server.js`
3. Verify Next.js app starts and serves requests
4. Add instrumentation.ts with basic OTEL setup
5. Verify spans appear in console output
6. Run E2E tests to confirm no regressions
7. Deploy to preview environment
8. Compare cold start times (before/after)

### Rollback Plan

If critical issues arise:
1. Revert Dockerfile to Bun base image
2. Implement manual-only instrumentation (more work but functional)
3. Track Bun OTEL support for future re-evaluation

### Status

**Approved** - 2025-12-08

---

## References

### Official Documentation
- [OpenTelemetry JavaScript SDK](https://opentelemetry.io/docs/languages/js/)
- [Next.js Instrumentation Guide](https://nextjs.org/docs/app/guides/open-telemetry)
- [oRPC OpenTelemetry Integration](https://orpc.unnoq.com/docs/integrations/opentelemetry)
- [Bun Node.js Compatibility](https://bun.sh/docs/runtime/nodejs-apis)

### NPM Packages
- [@opentelemetry/sdk-node](https://www.npmjs.com/package/@opentelemetry/sdk-node)
- [@vercel/otel](https://www.npmjs.com/package/@vercel/otel)
- [@opentelemetry/instrumentation-pg](https://www.npmjs.com/package/@opentelemetry/instrumentation-pg)
- [@opentelemetry/instrumentation-undici](https://www.npmjs.com/package/@opentelemetry/instrumentation-undici)
- [@opentelemetry/instrumentation-pino](https://www.npmjs.com/package/@opentelemetry/instrumentation-pino)
- [pino-opentelemetry-transport](https://www.npmjs.com/package/pino-opentelemetry-transport)
- [@kubiks/otel-drizzle](https://www.npmjs.com/package/@kubiks/otel-drizzle)

### GitHub Issues & Discussions
- [Bun OTEL Issue #3775](https://github.com/oven-sh/bun/issues/3775)
- [Bun OTEL Discussion #7185](https://github.com/oven-sh/bun/discussions/7185)
- [OpenTelemetry JS SDK 2.0 Announcement](https://opentelemetry.io/blog/2025/otel-js-sdk-2-0/)

### Comparison Articles
- [Jaeger vs Tempo](https://signoz.io/blog/jaeger-vs-tempo/)
- [SigNoz vs Grafana](https://signoz.io/comparisons/signoz-vs-grafana/)
- [OpenTelemetry Collector Deployment Patterns](https://signoz.io/blog/opentelemetry-deployment-patterns/)
