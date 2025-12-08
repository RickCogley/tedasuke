# TeDasuke (手助け)

A fluent, type-safe TypeScript client library for the TeamDesk/DBFlex REST API.

**TeDasuke** (手助け) means "helping hand" in Japanese - and that's exactly what
this library provides for working with the TeamDesk API.

## Features

- 🎯 **Fluent API** - Chainable methods that read like English
- 🔒 **Type-safe** - Full TypeScript support with generic types
- 🚀 **Modern** - Built for Deno with Node.js compatibility via JSR
- 📦 **Zero dependencies** - Uses native Deno/Web APIs
- 🎨 **Intuitive** - Simple things are simple, complex things are possible
- 🔄 **Auto-pagination** - Built-in support for fetching large datasets
- ✨ **Clean errors** - Rich error context for debugging

## Installation

### Deno

```typescript
import { TeamDeskClient } from "jsr:@rick/tedasuke";
```

### Node.js (via JSR)

```bash
npx jsr add @rick/tedasuke
```

```typescript
import { TeamDeskClient } from "@rick/tedasuke";
```

## Quick Start

```typescript
import { TeamDeskClient } from "jsr:@rick/tedasuke";

// Create a client (defaults to TeamDesk API)
const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("TD_TOKEN")!,
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

// With filtering
const activeOrders = await client
  .table("Orders")
  .select()
  .filter('[Status]="Active" and [Total]>1000')
  .execute();

// With sorting
const recentOrders = await client
  .table("Orders")
  .select()
  .sort("OrderDate", "DESC")
  .limit(50)
  .execute();

// Pagination
const page2 = await client
  .table("Orders")
  .select()
  .skip(100)
  .limit(100)
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
    console.error(`Failed: ${result.errors}`);
  }
});

// Update records (requires key field)
const updated = await client
  .table("Clients")
  .update([
    { key: "ID123", Status: "Active" },
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
const results = await client
  .table("Clients")
  .create(
    [{ CompanyName: "Test Corp" }],
    { workflow: false }, // Won't trigger TeamDesk workflow rules
  );
```

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
  console.error("Failed:", result.errors);
  // Show error message to user
}
```

### Error Handling

TeDasuke provides rich error context:

```typescript
import {
  AuthenticationError,
  TeamDeskError,
  ValidationError,
} from "jsr:@rick/tedasuke";

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

### Cache Fallback (Build Resilience)

TeDasuke includes automatic caching to disk for build resilience. **Caching is
enabled by default** and falls back to cached data when the API is unavailable.

**Default behavior:**

```typescript
import { TeamDeskClient } from "jsr:@rick/tedasuke";

// Caching is automatic - defaults to "./_tdcache" directory
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
  cacheDir: "src/_data/_tdcache", // Custom location
});
```

**Disable caching:**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
  cacheDir: null, // or false - disables caching
});
```

**Using `fetchWithCache` helper:**

```typescript
import { fetchWithCache, TeamDeskClient } from "jsr:@rick/tedasuke";

const client = new TeamDeskClient({
  appId: 12345,
  token: Deno.env.get("API_KEY")!,
  cacheDir: "./_tdcache", // Configure once
});

// Pass client directly - it uses the configured cache directory
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
import { TeamDeskClient } from "jsr:@rick/tedasuke";

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
- `update(records, options?)` - Update existing records, returns
  `UpdateResult<T>[]`
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

**Basic auth:**

```typescript
const client = new TeamDeskClient({
  appId: 12345,
  user: "username",
  password: "password",
});
```

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

This package is published to JSR (JavaScript Registry):

```bash
# Dry run to validate
deno task publish

# Publish for real
deno publish
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Credits

Built by Rick Cogley for use with Lume SSG, but designed as a general-purpose
TeamDesk client library.

TeamDesk is a product of ForeSoft Corporation.
