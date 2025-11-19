/**
 * TeDasuke - TeamDesk TypeScript Client Library
 *
 * A fluent, type-safe library for interacting with the TeamDesk/DBFlex REST API.
 * "TeDasuke" (手助け) means "helping hand" in Japanese.
 *
 * @example
 * ```typescript
 * import { TeamDeskClient } from "jsr:@rick/tedasuke";
 *
 * const client = new TeamDeskClient({
 *   appId: 15331,
 *   token: Deno.env.get("TD_TOKEN")!
 * });
 *
 * // Simple query
 * const orders = await client
 *   .table('Orders')
 *   .select()
 *   .execute();
 *
 * // With filtering and sorting
 * const activeOrders = await client
 *   .table('Orders')
 *   .select(['OrderID', 'Total', 'CustomerName'])
 *   .filter('[Status]="Active"')
 *   .sort('OrderDate', 'DESC')
 *   .limit(100)
 *   .execute();
 *
 * // Using a view
 * const data = await client
 *   .table('Orders')
 *   .view('Active Orders')
 *   .select()
 *   .execute();
 * ```
 *
 * @module
 */

// Export main client
export { TeamDeskClient } from "./src/client.ts";

// Export table and view clients
export { TableClient, ViewClient } from "./src/table.ts";

// Export error classes
export {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TeamDeskError,
  ValidationError,
} from "./src/errors.ts";

// Export cache utilities
export {
  clearCache,
  fetchWithCache,
  getCacheInfo,
  loadFromCache,
  saveToCache,
} from "./src/cache.ts";

// Export types
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
