/**
 * # TeDasuke — TeamDesk / DBFlex TypeScript client
 *
 * A fluent, type-safe library for the TeamDesk / DBFlex REST API.
 * "TeDasuke" (手助け) means "helping hand" in Japanese.
 *
 * ## Runtime compatibility
 *
 * The main entry (`@rick/tedasuke`) uses only `fetch()` and standard Web APIs —
 * no Deno, Node, or browser-specific globals. It runs unchanged on:
 *
 * - **Deno** (any version)
 * - **Node.js** ≥ 18 (native fetch)
 * - **Bun**
 * - **Cloudflare Workers**
 * - **Browsers** — works in principle, but the TeamDesk REST API typically
 *   does not allow CORS, so practical use from a browser is rare
 *
 * The optional filesystem cache for build resilience lives in a separate
 * Deno-only entry: `@rick/tedasuke/cache`. It is not re-exported from this
 * module — Workers/Node/Bun consumers don't even import the Deno FS code.
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@rick/tedasuke
 *
 * # Node.js / Bun
 * npx jsr add @rick/tedasuke
 * # or
 * bunx jsr add @rick/tedasuke
 * ```
 *
 * ## Quick start
 *
 * ```typescript
 * import { TeamDeskClient } from "@rick/tedasuke";
 *
 * const client = new TeamDeskClient({
 *   appId: 12345,
 *   token: "your-api-token",
 *   useBearerAuth: true, // recommended — keeps token out of URL
 * });
 *
 * const orders = await client
 *   .table("Orders")
 *   .select(["OrderID", "Total", "CustomerName"])
 *   .filter('[Status]="Active"')
 *   .sort("OrderDate", "DESC")
 *   .limit(100)
 *   .execute();
 * ```
 *
 * ## Filesystem cache (Deno only)
 *
 * For static-site generators and other Deno workflows that need build-time
 * resilience when the API is briefly unavailable:
 *
 * ```typescript
 * import { TeamDeskClient } from "@rick/tedasuke";
 * import { fetchWithCache } from "@rick/tedasuke/cache";
 *
 * const client = new TeamDeskClient({ appId: 12345, token: "..." });
 *
 * const result = await fetchWithCache(
 *   client,
 *   "orders",
 *   () => client.table("Orders").select().execute(),
 * );
 *
 * if (result.fromCache) {
 *   console.warn(`Using cached data (${result.cacheAge?.toFixed(1)} min old)`);
 * }
 * ```
 *
 * @module
 */

// Main client
export { TeamDeskClient } from "./src/client.ts";

// Table and view clients
export { TableClient, ViewClient } from "./src/table.ts";

// Error classes
export {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TeamDeskError,
  ValidationError,
} from "./src/errors.ts";

// Types
export type {
  ApiError,
  ColumnSchema,
  CreateResult,
  DatabaseSchema,
  DeleteOptions,
  DeleteResult,
  SelectOptions,
  TableSchema,
  TeamDeskConfig,
  TeamDeskRecord,
  UpdateResult,
  UpsertResult,
  WriteOptions,
} from "./src/types.ts";
