# TeDasuke (手助け)

A fluent, type-safe TypeScript client library for the TeamDesk/DBFlex REST API.

**TeDasuke** (手助け) means "helping hand" in Japanese - and that's exactly what
this library provides for working with the TeamDesk API.

## Features

- 🎯 **Fluent API** - Chainable methods that read like English
- 🔒 **Type-safe** - Full TypeScript support with generic types
- 🌐 **Multi-runtime** - Runs on Deno, Node.js (≥18), Bun, and Cloudflare
  Workers using only `fetch()` and standard Web APIs
- 📦 **Zero dependencies** - No third-party packages
- 🎨 **Intuitive** - Simple things are simple, complex things are possible
- 🔄 **Auto-pagination** - Built-in support for fetching large datasets
- ✨ **Clean errors** - Rich error context for debugging
- 💾 **Optional Deno-only filesystem cache** - For build resilience in
  static-site generators (separate import — non-Deno consumers don't pull it in)

## Runtime compatibility

| Runtime            | Main entry (`@rick/tedasuke`)                      | Filesystem cache (`@rick/tedasuke/cache`) |
| ------------------ | -------------------------------------------------- | ----------------------------------------- |
| Deno               | ✅                                                 | ✅                                        |
| Node.js ≥ 18       | ✅                                                 | ❌ (uses `Deno.*` FS APIs)                |
| Bun                | ✅                                                 | ❌                                        |
| Cloudflare Workers | ✅                                                 | ❌ (no filesystem)                        |
| Browsers           | ⚠️ TeamDesk REST API typically does not allow CORS | ❌                                        |

The main entry uses only `fetch()` and standard Web APIs. The cache module is
deliberately a separate import so non-Deno consumers don't pull in any
Deno-specific code.

## Installation

### Deno

```bash
deno add jsr:@rick/tedasuke
# Optional Deno-only filesystem cache:
deno add jsr:@rick/tedasuke/cache
```

```typescript
import { TeamDeskClient } from "@rick/tedasuke";
```

### Node.js / Bun (via JSR)

```bash
npx jsr add @rick/tedasuke
# or
bunx jsr add @rick/tedasuke
```

```typescript
import { TeamDeskClient } from "@rick/tedasuke";
```

### Cloudflare Workers

```bash
npx jsr add @rick/tedasuke
```

```typescript
import { TeamDeskClient } from "@rick/tedasuke";

export default {
  async fetch(_req, env) {
    const client = new TeamDeskClient({
      appId: 12345,
      token: env.TD_TOKEN,
      useBearerAuth: true,
    });
    const orders = await client.table("Orders").select().limit(50).execute();
    return Response.json(orders);
  },
};
```

## Quick Start

```typescript
import { TeamDeskClient } from "@rick/tedasuke";

// Create a client (defaults to TeamDesk API)
const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("TD_TOKEN")!,
  useBearerAuth: true, // Optional: use Bearer token auth (recommended for security)
});

// Fetch data with a fluent API
const orders = await client
  .table("Orders")
  .select(["OrderID", "Total", "CustomerName"])
  .filter('[Status]="Active"')
  .sort("OrderDate", "DESC")
  .limit(100)
  .execute();

console.log(`Found ${orders.length} orders`);
```

## Usage Examples

### Basic Queries

```typescript
// Select all records from a table
const clients = await client
  .table("Clients")
  .select()
  .execute();

// Select specific columns
const orders = await client
  .table("Orders")
  .select(["OrderID", "Total", "CustomerName"])
  .execute();

// Filtering with TeamDesk formula syntax
// See: https://www.teamdesk.net/help/working-with-formulas/
const activeOrders = await client
  .table("Orders")
  .select()
  .filter('[Status]="Active" and [Total]>1000')
  .execute();

// Sorting (URL: ?sort=OrderDate//DESC)
const recentOrders = await client
  .table("Orders")
  .select()
  .sort("OrderDate", "DESC")
  .limit(50)
  .execute();

// Sort by column with spaces (URL: ?sort=Last%20Modified//DESC)
const recentlyModified = await client
  .table("Records")
  .select()
  .sort("Last Modified", "DESC")
  .limit(100)
  .execute();

// Pagination (URL: ?skip=100&top=100)
const page2 = await client
  .table("Orders")
  .select()
  .skip(100) // Skip first 100 records
  .limit(100) // Return next 100 records
  .execute();
```

### Using Views

Views are pre-configured queries in the TeamDesk UI. TeDasuke makes them easy to
use:

```typescript
// Access a view
const activeOrders = await client
  .table("Orders")
  .view("Active Orders")
  .select()
  .execute();

// Views with pagination
const topProjects = await client
  .table("Projects")
  .view("Top Projects")
  .select()
  .limit(10)
  .execute();
```

### Type Safety

Add TypeScript types for autocomplete and type checking:

```typescript
interface Order {
  "@row.id": number;
  OrderID: string;
  CustomerName: string;
  Total: number;
  Status: string;
  OrderDate: string;
}

const orders = await client
  .table<Order>("Orders")
  .select()
  .execute();

// Now you get autocomplete and type safety
orders.forEach((order) => {
  console.log(order.CustomerName); // TypeScript knows this exists
});
```

### Auto-pagination for Large Datasets

Fetch all records automatically with batch processing:

```typescript
// Automatically handles pagination in 500-record batches
for await (const batch of client.table("Orders").select().selectAll()) {
  console.log(`Processing batch of ${batch.length} orders`);
  // Process each batch
}
```

### Write Operations

```typescript
// Create records
const results = await client
  .table("Clients")
  .create([
    { CompanyName: "Acme Corp", Industry: "Tech" },
    { CompanyName: "Globex Inc", Industry: "Manufacturing" },
  ]);

// Check results
results.forEach((result) => {
  if (result.success) {
    console.log(`Created record ${result.id} with key ${result.key}`);
  } else {
    console.error("Failed:", result.errors.map((e) => e.message).join("; "));
  }
});

// Update records by @row.id (preferred)
const updated = await client
  .table("Clients")
  .update([
    { "@row.id": 123, Status: "Active" },
  ]);

// Update records by key (string — automatically converted to @row.id)
const updated2 = await client
  .table("Clients")
  .update([
    { key: "123", Status: "Active" },
  ]);

// Upsert (create or update based on match column)
const upserted = await client
  .table("Contacts")
  .upsert(
    [{ Email: "john@example.com", Name: "John Doe" }],
    "Email", // Match on Email column
  );

// Check if record was created or updated
upserted.forEach((result) => {
  if (result.success) {
    console.log(`${result.action} record ${result.id}`); // "created" or "updated"
  }
});

// Disable workflow triggers
const quietResult = await client
  .table("Clients")
  .create(
    [{ CompanyName: "Test Corp" }],
    { workflow: false }, // Won't trigger TeamDesk workflow rules
  );
```

> **Note on record identification:** The TeamDesk API uses `@row.id` (a numeric
> internal ID) to identify records for updates. TeDasuke accepts either
> `@row.id` (number) or `key` (string) — if you pass `key`, it is automatically
> converted to a numeric `@row.id`. The `@row.id` value is returned in every
> select query result.

#### Write Operation Results

All write operations (`create`, `update`, `upsert`) return result objects with
the following properties:

```typescript
interface CreateResult<T> {
  success: boolean; // true if HTTP status 200-299
  status: number; // HTTP status code (200, 201, etc.)
  data: Partial<T>; // The record data
  id?: number; // Row ID of the record
  key?: string; // Key value of the record
  errors: ApiError[]; // Any errors that occurred
}

interface UpsertResult<T> extends CreateResult<T> {
  action: "created" | "updated"; // Whether record was created or updated
}
```

Example usage:

```typescript
const results = await client.table("Web Lead").upsert([
  {
    f_1655786: "John",
    f_1655792: "Doe",
    f_1655893: "john@example.com",
  },
]);

const result = results[0];

if (result.success) {
  console.log(`Success! Record ${result.action} with ID: ${result.id}`);
  // Redirect to success page, etc.
} else {
  // errors is an array of { column?: string, message: string }
  const messages = result.errors.map((e) =>
    e.column ? `${e.column}: ${e.message}` : e.message
  );
  console.error("Failed:", messages.join("; "));
}
```

### Error Handling

TeDasuke provides rich error context:

```typescript
import {
  AuthenticationError,
  TeamDeskError,
  ValidationError,
} from "@rick/tedasuke";

try {
  const data = await client
    .table("Orders")
    .select()
    .execute();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof ValidationError) {
    console.error("Validation error:", error.message);
    console.error("Details:", error.details);
  } else if (error instanceof TeamDeskError) {
    console.error("TeamDesk error:", error.message);
    console.error("Status:", error.status);
    console.error("URL:", error.url);
  }
}
```

### Cache Fallback (Build Resilience, Deno only)

The optional `@rick/tedasuke/cache` entry provides a filesystem cache that falls
back to the last-known-good data when the API is briefly unavailable. It uses
`Deno.*` filesystem APIs and **only works on Deno** (typical use: Lume /
static-site builds).

The `cacheDir` option on `TeamDeskClient` simply records the path the client
should hand to the cache helpers — it does not pull in any FS code on its own,
so it's safe to set even on non-Deno runtimes (the path is just unused).

**Default cache directory:**

```typescript
import { TeamDeskClient } from "@rick/tedasuke";

// cacheDir defaults to "./_tdcache" — only meaningful when using @rick/tedasuke/cache
const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
});
```

**Custom cache directory:**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
  cacheDir: "src/_data/_tdcache",
});
```

**Disable caching:**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
  cacheDir: null, // or false
});
```

**Using `fetchWithCache` helper (Deno only):**

```typescript
import { TeamDeskClient } from "@rick/tedasuke";
import { fetchWithCache } from "@rick/tedasuke/cache";

const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
  cacheDir: "./_tdcache",
});

const result = await fetchWithCache(
  client,
  "orders",
  () => client.table("Orders").select().execute(),
);

if (result.fromCache) {
  console.warn(
    `Using cached data (${result.cacheAge?.toFixed(1)} minutes old)`,
  );
}

export const orders = result.data;
```

This ensures your static site builds succeed even when the API is temporarily
unavailable.

### Lume SSG Integration

Perfect for static site generation with Lume:

```typescript
// In your _data/prodb.ts file
import { TeamDeskClient } from "@rick/tedasuke";

const td = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
  baseUrl: "https://my.dbflex.net/secure/api/v2", // for DBFlex
});

// These exports become available in your Lume templates
export const holidays = await td
  .table("Work Holiday")
  .view("API Holidays Today or Later")
  .select()
  .execute();

export const projects = await td
  .table("Web Project")
  .view("API List All")
  .select()
  .limit(3)
  .execute();

export const contacts = await td
  .table("Web Japan Contact and App")
  .select()
  .execute();
```

## API Reference

### `TeamDeskClient`

Main client class for interacting with TeamDesk.

**Constructor options:**

- `appId` (string | number) - Your TeamDesk application ID
- `token` (string) - API token (preferred authentication method)
- `user` (string) - Username for basic auth (alternative to token)
- `password` (string) - Password for basic auth (alternative to token)
- `baseUrl` (string) - API base URL (defaults to
  `https://www.teamdesk.net/secure/api/v2`; override for DBFlex
  `https://my.dbflex.net/secure/api/v2` or custom domains)
- `cacheDir` (string | null | false) - Cache directory path (defaults to
  `./_tdcache`; set to `null` or `false` to disable)
- `debug` (boolean) - Enable debug logging (optional)

**Methods:**

- `table<T>(tableName: string)` - Get a TableClient for the specified table
- `describe()` - Get database schema information

### `TableClient<T>`

Client for a specific table.

**Methods:**

- `select(columns?: string[])` - Start building a SELECT query
- `view(viewName: string)` - Access a view on this table
- `create(records, options?)` - Create new records, returns `CreateResult<T>[]`
- `update(records, options?)` - Update existing records (identify by `@row.id`
  or `key`), returns `UpdateResult<T>[]`
- `upsert(records, matchColumn?, options?)` - Create or update records, returns
  `UpsertResult<T>[]`
- `delete(key, options?)` - Delete a record, returns `DeleteResult`

### `SelectBuilder<T>`

Fluent query builder for SELECT operations.

**Methods:**

- `filter(expression: string)` - Add a filter (TeamDesk formula language)
- `sort(column: string, direction?: 'ASC' | 'DESC')` - Add sorting
- `limit(n: number)` - Limit results (max 500)
- `skip(n: number)` - Skip records for pagination
- `execute()` - Execute the query and return results
- `selectAll()` - Auto-paginate through all results

### `ViewClient<T>`

Client for a specific view.

**Methods:**

- `select(columns?: string[])` - Start building a query on this view

## TeamDesk Filter Language

TeDasuke uses TeamDesk's formula language for filters. Here are some examples:

```typescript
// Equality
.filter('[Status]="Active"')

// Comparison
.filter('[Amount]>1000')
.filter('[Date]>="2024-01-01"')

// Logical operators
.filter('[Status]="Active" and [Amount]>1000')
.filter('[Status]="Active" or [Status]="Pending"')

// Functions
.filter('IsBlank([ShippedDate])')
.filter('Contains([Description], "urgent")')
.filter('Year([Date])=2024')
```

## Query Parameters Reference

TeDasuke methods map to TeamDesk/DBFlex REST API URL parameters:

| Method                     | URL Parameter       | Example                       | Description                                                                            |
| -------------------------- | ------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `.limit(n)`                | `?top=n`            | `?top=100`                    | Limit results to n records (max 500)                                                   |
| `.skip(n)`                 | `?skip=n`           | `?skip=100`                   | Skip first n records (for pagination)                                                  |
| `.sort(column, direction)` | `?sort=Column//DIR` | `?sort=Last%20Modified//DESC` | Sort by column ASC or DESC                                                             |
| `.filter(formula)`         | `?filter=...`       | `?filter=[Status]="Active"`   | Filter using [TeamDesk formulas](https://www.teamdesk.net/help/working-with-formulas/) |

### Common Patterns

```typescript
// Get last 100 most recently modified records
const recent = await client
  .table("Records")
  .select()
  .sort("Last Modified", "DESC")
  .limit(100)
  .execute();
// URL: /Records/select.json?sort=Last%20Modified//DESC&top=100

// Pagination: Get page 3 (records 201-300)
const page3 = await client
  .table("Orders")
  .select()
  .skip(200)
  .limit(100)
  .execute();
// URL: /Orders/select.json?skip=200&top=100

// Complex filtering
const filtered = await client
  .table("Tasks")
  .select()
  .filter('[Priority]="High" and [Status]<>"Completed"')
  .sort("Due Date", "ASC")
  .limit(50)
  .execute();
// URL: /Tasks/select.json?filter=[Priority]="High" and [Status]<>"Completed"&sort=Due%20Date//ASC&top=50
```

## Error Types

- `TeamDeskError` - Base error class
- `AuthenticationError` - Authentication failed (401, 403)
- `ValidationError` - Validation failed (400, 422)
- `NotFoundError` - Resource not found (404)
- `RateLimitError` - Rate limit exceeded (429)
- `ServerError` - Server error (500+)

## Configuration

### Authentication

TeDasuke supports two authentication methods:

**Token-based (recommended):**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: "your-api-token",
});
```

**Token-based with Bearer Auth (recommended for production):**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: "your-api-token",
  useBearerAuth: true, // Sends token as "Authorization: Bearer" header
});
```

When `useBearerAuth` is enabled, the token is sent as an `Authorization: Bearer`
header instead of being included in the URL path. This prevents the token from
appearing in server logs and is the recommended approach for production
environments.

**Basic auth:**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  user: "username",
  password: "password",
});
```

Note: Basic auth does not support `useBearerAuth` mode.

### Custom Base URL

For DBFlex or custom installations:

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: "your-token",
  baseUrl: "https://my.dbflex.net/secure/api/v2",
});
```

### Debug Mode

Enable debug logging to see all API requests:

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: "your-token",
  debug: true,
});
```

## Development

```bash
# Run examples
deno task example

# Run type checking
deno task check

# Run linter
deno task lint

# Format code
deno task fmt

# Run all preflight checks
deno task preflight
```

## Testing

Set up environment variables:

```bash
export TD_APP_ID=12345
export TD_TOKEN="your-api-token"
```

Run the basic example:

```bash
deno task example
```

## Publishing

This package is published to JSR (JavaScript Registry). Releases are automated —
`.github/workflows/publish.yml` runs on any `v*` tag push and calls
`deno publish` with provenance via OIDC.

```bash
# Local dry-run to validate
deno task publish:dry

# Cut a release (creates the tag, pushes it, triggers publish.yml)
gh release create v0.3.0 --notes "..."
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Credits

Built by Rick Cogley for use with Lume SSG, but designed as a general-purpose
TeamDesk client library.

TeamDesk is a product of ForeSoft Corporation.
