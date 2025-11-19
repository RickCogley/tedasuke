# TeamDesk TypeScript Client Library - Project Kickoff

## Project Overview

**Goal:** Build a comprehensive TypeScript library for the TeamDesk/DBFlex REST
API that prioritizes developer experience through a fluent API design pattern.

**Target Runtime:** Deno (primary) with Node.js compatibility

**Publishing:** JSR (JavaScript Registry) for Deno-first distribution, with npm
compatibility

**Use Case:** Fetching TeamDesk data at build time for static site generation
(Lume SSG), but designed as a general-purpose library for any TeamDesk API
interaction.

---

## Background Context

### What is TeamDesk?

TeamDesk (also known as DBFlex) is a low-code database platform with a stable
REST API. The API has been relatively static for years, making it an ideal
candidate for a well-designed library that can be built once and maintained with
minimal changes.

### Why Build This Library?

**Current pain points:**

- Manual URL construction with encoding issues
- Repetitive fetch boilerplate and error handling
- String-based queries prone to typos
- No type safety or autocomplete
- Complex pagination logic scattered across code
- TeamDesk's custom formula language requires careful escaping

**Expected benefits:**

- Reduce ~140 lines of boilerplate to ~50 lines of clear intent
- Fluent, chainable API that reads like English
- Type-safe operations with IDE autocomplete
- Built-in pagination, caching, and error handling
- One-time effort, long-term value

---

## TeamDesk REST API Reference

### Base API Structure

```
https://www.teamdesk.net/secure/api/v2/{appId}/{token}/...
```

### Authentication

- Token-based (preferred): `/v2/{appId}/{token}/...`
- Basic auth (alternative): `/v2/{appId}/{user:password}/...`

### Key Endpoints

**Describe Database:**

```
GET /v2/{appId}/{auth}/describe.json
```

**Describe Table:**

```
GET /v2/{appId}/{auth}/{table}/describe.json
```

**Select from Table:**

```
GET /v2/{appId}/{auth}/{table}/select.json?column=Name&column=Date&filter=IsActive%3Dtrue&sort=Date//DESC&top=100&skip=0
```

**Select from View:**

```
GET /v2/{appId}/{auth}/{table}/{viewName}/select.json
```

**Create Records:**

```
POST /v2/{appId}/{auth}/{table}/create.json?workflow=1
Body: [{ "Name": "Test", "Value": 123 }]
```

**Update Records:**

```
POST /v2/{appId}/{auth}/{table}/update.json?workflow=1
Body: [{ "key": "ID123", "Status": "Active" }]
```

**Upsert Records:**

```
POST /v2/{appId}/{auth}/{table}/upsert.json?match=Email&workflow=1
Body: [{ "Email": "test@example.com", "Name": "Updated" }]
```

**Delete Records:**

```
GET /v2/{appId}/{auth}/{table}/delete.json?key=ID123&workflow=1&purge=0
```

**Change Tracking:**

```
GET /v2/{appId}/{auth}/{table}/updated.json?from=2024-01-01T00:00:00
GET /v2/{appId}/{auth}/{table}/deleted.json?from=2024-01-01T00:00:00
```

### Important API Details

**Pagination:**

- Maximum 500 records per request
- Use `top` and `skip` parameters for pagination
- `skip=0&top=500` (page 1), `skip=500&top=500` (page 2)

**Workflow Rules:**

- REST API triggers workflow rules by default (unlike SOAP API)
- Use `workflow=0` to disable (requires ManageData permissions)
- This is a common gotcha for developers

**Filtering:**

- Uses TeamDesk's custom formula language (not SQL)
- Example: `[Status]="Active" and [Amount]>1000`
- Special functions: `IsBlank([Field])`, `Contains([Field], "text")`,
  `Year([Date])=2024`
- Strings must be quoted and escaped: `"John \"Doe\""`
- Dates: `[Date]>="2024-01-01"`

**Response Format:**

```json
[
  {
    "@row.id": 12,
    "@row.allow": "Edit, Delete",
    "Id": "60",
    "Text": "Sample",
    "Checkbox": true,
    "Date": "2014-11-18T00:00:00+00:00",
    "Number": 1234567
  }
]
```

**Views:**

- Pre-configured queries in TeamDesk UI
- Access via `/{table}/{viewName}/select.json`
- View names must be URL encoded (spaces become `%20`)

**Caching:**

- API supports conditional caching (ETags, If-Modified-Since headers)
- This is a killer feature for build-time SSG optimization

---

## Design Decisions

### 1. Fluent API Pattern

**What is a fluent API?** A design pattern popularized by Martin Fowler where
methods return `this` (or a builder), enabling readable method chaining that
reads like natural language.

**Why fluent?**

- Extremely well-suited for query building
- Progressive disclosure (simple things simple, complex things possible)
- Excellent IDE autocomplete experience
- Common pattern developers expect for database queries

**Example:**

```typescript
// Fluent - reads like English
const orders = await client
  .table("Orders")
  .select(["OrderID", "Total", "CustomerName"])
  .filter(f.eq("Status", "Active"))
  .sort("OrderDate", "DESC")
  .limit(100)
  .execute();

// vs Traditional - verbose and disconnected
const query = new Query();
query.setTable("Orders");
query.setColumns(["OrderID", "Total", "CustomerName"]);
query.setFilter("Status=Active");
query.setSortColumn("OrderDate");
query.setSortDirection("DESC");
query.setLimit(100);
const orders = await query.execute();
```

### 2. Architecture

**Core Components:**

1. **TeamDeskClient** - Main entry point, handles auth and requests
2. **TableClient** - Wraps table operations, provides fluent interface
3. **SelectBuilder** - Builds SELECT queries with chaining
4. **ViewClient** - Specialized interface for views
5. **Filter Builders** - Type-safe formula language generation
6. **Error Types** - Rich error context for debugging
7. **Cache Adapter** - Pluggable caching interface

**Type Safety:**

- Generic `table<T>()` method preserves TypeScript types
- Discriminated unions for response types (success/error)
- Strong typing for filter builders

### 3. Key Features

**Must-have:**

- Core CRUD operations (select, create, update, upsert, delete)
- View support
- Automatic pagination with `selectAll()` generator
- Filter builder for common operations
- Raw filter escape hatch for complex cases
- Rich error messages with context
- Change tracking (updated/deleted)

**Nice-to-have:**

- Optional caching layer
- Schema introspection and type generation
- Attachment handling helpers
- Retry logic with exponential backoff
- Request deduplication

**Explicitly out of scope (for MVP):**

- Full ORM features (relationships, migrations)
- Document generation
- Complex formula language validation
- TeamDesk UI automation

---

## Publishing Strategy

### JSR (JavaScript Registry) - Primary Target

**Why JSR?**

- Native Deno support with zero configuration
- Automatic TypeScript type generation
- Built-in documentation generation from JSDoc
- Modern, fast, and designed for ESM
- Works seamlessly with Deno, Node.js, and browsers
- Native npm compatibility layer

**Package naming:**

```
@scope/teamdesk-client
```

**JSR Configuration:**

```json
// jsr.json
{
  "name": "@scope/teamdesk-client",
  "version": "1.0.0",
  "exports": "./mod.ts"
}
```

**Publishing to JSR:**

```bash
# Authenticate (one time)
deno publish --dry-run

# Publish
deno publish
```

**Usage from JSR:**

```typescript
// Deno
import { TeamDeskClient } from "jsr:@scope/teamdesk-client";

// Node.js (with JSR npm compatibility)
import { TeamDeskClient } from "@scope/teamdesk-client";
```

### npm - Secondary Target (Optional)

For maximum compatibility, also publish to npm:

**package.json:**

```json
{
  "name": "@scope/teamdesk-client",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/mod.js",
  "types": "./dist/mod.d.ts",
  "exports": {
    ".": {
      "import": "./dist/mod.js",
      "types": "./dist/mod.d.ts"
    }
  }
}
```

**Build for npm:**

```bash
# Use dnt (Deno to Node Transform)
deno run -A scripts/build_npm.ts
```

### Distribution Strategy

1. **Primary:** JSR for Deno-first users
2. **Secondary:** npm for Node.js ecosystem
3. **Direct URL:** `https://deno.land/x/teamdesk/mod.ts` (optional)

**Recommended approach:** Start with JSR only. Add npm later if there's demand
from Node.js users.

---

## Specific Use Case: Lume SSG

### Current Implementation

Rick's Lume config fetches data like this:

```typescript
// Current: Manual fetch with boilerplate (~140 lines)
const baseUrl = "https://pro.dbflex.net/secure/api/v2/15331";
const apiKey = Deno.env.get("API_KEY_01");

const endpoints = [
  {
    name: "futureholidays",
    path: "Work%20Holiday/API%20Holidays%20Today%20or%20Later",
  },
  { name: "nextholiday", path: "Work%20Holiday/API%20Holidays%20Next" },
  { name: "webinfo", path: "Web%20Information/API%20List%20All" },
  {
    name: "projects",
    path: "Web%20Project/API%20List%20All",
    params: "?top=3",
  },
  // ... more endpoints
];

const results = await Promise.all(
  endpoints.map(async (endpoint) => {
    const url = `${baseUrl}/${apiKey}/${endpoint.path}/select.json${
      endpoint.params || ""
    }`;
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    const data = await response.json();
    return { name: endpoint.name, data };
  }),
);

// Write to JSON files for Lume
for (const { name, data } of results) {
  await Deno.writeTextFile(
    `src/_data/${name}.json`,
    JSON.stringify(data, null, 2),
  );
}
```

### Target Implementation with Library

```typescript
// Target: Clean and expressive (~50 lines)
import { TeamDeskClient } from "jsr:@scope/teamdesk-client";

const td = new TeamDeskClient({
  appId: 15331,
  token: Deno.env.get("API_KEY_01")!,
});

// Option 1: Direct data export for Lume
export const futureholidays = await td
  .table("Work Holiday")
  .view("API Holidays Today or Later")
  .select()
  .execute();

export const nextholiday = await td
  .table("Work Holiday")
  .view("API Holidays Next")
  .select()
  .execute();

export const webinfo = await td
  .table("Web Information")
  .view("API List All")
  .select()
  .execute();

export const projects = await td
  .table("Web Project")
  .view("API List All")
  .select()
  .limit(3)
  .execute();

// Option 2: Parallel fetch with writing
const data = await Promise.all([
  td.table("Work Holiday").view("API Holidays Today or Later").select()
    .execute(),
  td.table("Work Holiday").view("API Holidays Next").select().execute(),
  // ... etc
]);
```

### Lume Integration Pattern

```typescript
// src/_data/prodb.ts
import { TeamDeskClient } from "jsr:@scope/teamdesk-client";

const td = new TeamDeskClient({
  appId: 15331,
  token: Deno.env.get("API_KEY_01")!,
  cache: new FileSystemCache("./_td_cache"), // Optional caching
});

// These become available as prodb.* in all Lume templates
export const holidays = await td.table("Work Holiday").view(
  "API Holidays Today or Later",
).select().execute();
export const projects = await td.table("Web Project").view("API List All")
  .select().limit(3).execute();
export const contacts = await td.table("Web Japan Contact and App").select()
  .execute();

console.log("✅ PROdb data loaded");
```

---

## Implementation Priorities

### Phase 1: Core Foundation (Days 1-2)

**Goal:** Basic working library that can fetch data

- [ ] Project setup (jsr.json, deno.json, directory structure)
- [ ] `TeamDeskClient` class with authentication
- [ ] `TableClient` with basic select/execute
- [ ] HTTP request wrapper with error handling
- [ ] Basic type definitions
- [ ] Simple example that works

**Success criteria:** Can fetch data from a table and view

### Phase 2: Fluent Query Building (Day 2-3)

**Goal:** Make queries readable and chainable

- [ ] `SelectBuilder` with method chaining
- [ ] Filter, sort, limit, skip methods
- [ ] View support in TableClient
- [ ] Pagination helper with `selectAll()` generator
- [ ] Update examples to showcase fluent API

**Success criteria:** Can build complex queries fluently

### Phase 3: Write Operations (Day 3-4)

**Goal:** Full CRUD support

- [ ] Create method with batch support
- [ ] Update method
- [ ] Upsert method with match column
- [ ] Delete method (by key and by ID)
- [ ] Workflow control parameter
- [ ] Result typing with success/error discrimination

**Success criteria:** Can perform all CRUD operations

### Phase 4: Filter Builders (Day 4-5)

**Goal:** Type-safe filter construction

- [ ] Filter builder classes (And, Or, Comparison)
- [ ] Helper functions (`f.eq()`, `f.gt()`, `f.isBlank()`, etc.)
- [ ] Value formatting (strings, dates, booleans, nulls)
- [ ] Raw filter escape hatch
- [ ] Comprehensive filter examples

**Success criteria:** Can build complex filters without string manipulation

### Phase 5: Polish & Documentation (Day 5+)

**Goal:** Production-ready library

- [ ] Change tracking (updated/deleted methods)
- [ ] Schema introspection (describe methods)
- [ ] Cache adapter interface (optional)
- [ ] Comprehensive JSDoc comments
- [ ] README with examples
- [ ] Test suite (optional but recommended)
- [ ] Publish to JSR

**Success criteria:** Library is documented and ready to use

---

## Code Examples

### Basic Client Usage

```typescript
import { TeamDeskClient } from "jsr:@scope/teamdesk-client";

const client = new TeamDeskClient({
  appId: 21995,
  token: "your-token-here",
});

// Simple select
const clients = await client
  .table("Clients")
  .select()
  .execute();

console.log(`Found ${clients.length} clients`);
```

### With Type Safety

```typescript
interface Client {
  "@row.id": number;
  ClientID: string;
  CompanyName: string;
  Industry: string;
  IsActive: boolean;
}

const clients = await client
  .table<Client>("Clients")
  .select(["ClientID", "CompanyName", "Industry"])
  .execute();

// clients is Client[], not any!
clients.forEach((c) => {
  console.log(c.CompanyName); // Autocompletes!
});
```

### Using Views

```typescript
const activeOrders = await client
  .table("Orders")
  .view("Active Orders")
  .select()
  .execute();
```

### Filtering

```typescript
import { f } from "jsr:@scope/teamdesk-client";

const filtered = await client
  .table("Orders")
  .select()
  .filter(
    f.and(
      f.eq("Status", "Active"),
      f.gte("Total", 1000),
      f.isBlank("ShippedDate"),
    ),
  )
  .execute();
```

### Pagination

```typescript
// Automatic pagination - yields batches of 500
for await (const batch of client.table("Orders").selectAll()) {
  console.log(`Processing ${batch.length} orders`);
  // Process batch
}

// Manual pagination
const page1 = await client
  .table("Orders")
  .select()
  .skip(0)
  .limit(100)
  .execute();

const page2 = await client
  .table("Orders")
  .select()
  .skip(100)
  .limit(100)
  .execute();
```

### Creating Records

```typescript
const results = await client
  .table("Clients")
  .create([
    { CompanyName: "Acme Corp", Industry: "Tech" },
    { CompanyName: "Globex Inc", Industry: "Manufacturing" },
  ]);

results.forEach((r) => {
  if (r.success) {
    console.log(`Created: ${r.id}`);
  } else {
    console.error(`Failed: ${r.errors[0].message}`);
  }
});
```

### Upserting

```typescript
// Create or update based on Email match
const results = await client
  .table("Contacts")
  .upsert(
    [
      { Email: "john@example.com", Name: "John Doe" },
      { Email: "jane@example.com", Name: "Jane Smith" },
    ],
    "Email", // Match column
  );

results.forEach((r) => {
  console.log(`${r.action}: ${r.data.Email}`); // 'created' or 'updated'
});
```

### Error Handling

```typescript
import { TeamDeskError } from "jsr:@scope/teamdesk-client";

try {
  const data = await client
    .table("Orders")
    .select()
    .filter("[InvalidFilter")
    .execute();
} catch (error) {
  if (error instanceof TeamDeskError) {
    console.error("TeamDesk API Error:", error.message);
    console.error("Status:", error.status);
    console.error("Details:", error.details);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Project Structure

```
teamdesk-client/
├── deno.json                 # Deno configuration
├── jsr.json                  # JSR package configuration
├── mod.ts                    # Main export file
├── README.md                 # Documentation
├── LICENSE                   # MIT license
│
├── src/
│   ├── client.ts            # TeamDeskClient class
│   ├── table.ts             # TableClient and ViewClient
│   ├── builders.ts          # SelectBuilder, etc.
│   ├── filters.ts           # Filter builder classes and helpers
│   ├── types.ts             # TypeScript interfaces
│   ├── errors.ts            # Custom error classes
│   ├── cache.ts             # Cache adapter interface
│   └── utils.ts             # URL encoding, date formatting, etc.
│
├── examples/
│   ├── basic-usage.ts       # Simple example
│   ├── lume-integration.ts  # Lume SSG example
│   ├── filtering.ts         # Filter examples
│   └── crud-operations.ts   # Create/update/delete examples
│
└── tests/                   # Optional: test suite
    ├── client.test.ts
    ├── filters.test.ts
    └── integration.test.ts
```

---

## Technical Requirements

### JSR Configuration

```json
// jsr.json
{
  "name": "@scope/teamdesk-client",
  "version": "1.0.0",
  "exports": "./mod.ts"
}
```

### Deno Configuration

```json
// deno.json
{
  "name": "@scope/teamdesk-client",
  "version": "1.0.0",
  "exports": "./mod.ts",
  "tasks": {
    "example": "deno run --allow-net --allow-env examples/basic-usage.ts",
    "test": "deno test --allow-net --allow-env",
    "publish": "deno publish --dry-run"
  },
  "fmt": {
    "semiColons": true,
    "singleQuote": true
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "publish": {
    "exclude": [
      ".git",
      ".github",
      "examples",
      "tests"
    ]
  }
}
```

### Main Export File

````typescript
// mod.ts
/**
 * TeamDesk TypeScript Client Library
 *
 * A fluent, type-safe library for interacting with the TeamDesk/DBFlex REST API.
 *
 * @example
 * ```typescript
 * import { TeamDeskClient, f } from 'jsr:@scope/teamdesk-client';
 *
 * const client = new TeamDeskClient({
 *   appId: 12345,
 *   token: 'your-token'
 * });
 *
 * const orders = await client
 *   .table('Orders')
 *   .select()
 *   .filter(f.eq('Status', 'Active'))
 *   .execute();
 * ```
 *
 * @module
 */

export { TeamDeskClient } from "./src/client.ts";
export { TableClient, ViewClient } from "./src/table.ts";
export { SelectBuilder } from "./src/builders.ts";
export { f } from "./src/filters.ts";
export { TeamDeskError } from "./src/errors.ts";

// Export types
export type {
  CacheAdapter,
  ColumnSchema,
  CreateResult,
  DeleteResult,
  TableSchema,
  TeamDeskConfig,
  UpdateResult,
  UpsertResult,
} from "./src/types.ts";
````

### TypeScript Interfaces (Starter)

```typescript
// src/types.ts
export interface TeamDeskConfig {
  appId: string | number;
  token?: string;
  user?: string;
  password?: string;
  baseUrl?: string;
  cache?: CacheAdapter;
  debug?: boolean;
}

export interface CreateResult<T> {
  success: boolean;
  status: number;
  data: Partial<T>;
  id?: number;
  key?: string;
  errors: ApiError[];
}

export interface ApiError {
  column?: string;
  message: string;
}

export interface CacheAdapter {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

---

## Testing Strategy

### Manual Testing Script

```typescript
// examples/test-connection.ts
import { TeamDeskClient } from "../mod.ts";

const client = new TeamDeskClient({
  appId: Deno.env.get("TD_APP_ID")!,
  token: Deno.env.get("TD_TOKEN")!,
  debug: true,
});

console.log("Testing connection...");

try {
  const user = await client.user();
  console.log("✅ Connected as:", user.email);

  const tables = await client.describe();
  console.log("✅ Found", tables.tables.length, "tables");

  // Test a simple query
  const firstTable = tables.tables[0].recordsName;
  const data = await client.table(firstTable).select().limit(1).execute();
  console.log("✅ Fetched sample data from", firstTable);
} catch (error) {
  console.error("❌ Test failed:", error);
  Deno.exit(1);
}
```

---

## Key Implementation Notes

### URL Encoding

- Table names and view names must be URL encoded
- Use `encodeURIComponent()` for all user-provided strings
- Filter expressions also need encoding

### Error Context

TeamDesk returns helpful error messages. Preserve them:

```json
{
  "status": 400,
  "errors": [
    {
      "column": "Date",
      "message": "Invalid date format"
    }
  ]
}
```

### Workflow Parameter

Always expose workflow control:

```typescript
.create(data, { workflow: false })  // Disables triggers
```

### Response Shape

TeamDesk arrays have special `@row.*` properties:

```json
{
  "@row.id": 123,
  "@row.allow": "Edit, Delete",
  "YourColumn": "value"
}
```

### Formula Language Gotchas

- Strings: Must use double quotes `"text"`
- Dates: ISO format `"2024-01-01"`
- Booleans: Lowercase `true`, `false`
- Null: Lowercase `null`
- Column references: Square brackets `[ColumnName]`
- Escaping: Backslash for quotes `"John \"Doe\""`

---

## Publishing Checklist

### Before First JSR Publish

- [ ] Choose scope name (e.g., `@yourusername` or `@yourorg`)
- [ ] Create jsr.json with correct package name
- [ ] Add comprehensive JSDoc comments to all public APIs
- [ ] Create a detailed README.md with:
  - [ ] Installation instructions
  - [ ] Quick start example
  - [ ] API documentation
  - [ ] Usage examples
  - [ ] License information
- [ ] Add LICENSE file (recommend MIT)
- [ ] Test `deno publish --dry-run` to validate
- [ ] Set up GitHub repository (recommended)
- [ ] Create GitHub releases for version tracking

### Publishing Process

```bash
# 1. Validate package
deno publish --dry-run

# 2. Review what will be published
# Check the output for any unexpected files

# 3. Publish to JSR
deno publish

# 4. Verify on JSR
# Visit jsr.io/@scope/teamdesk-client
```

### Version Management

Follow semantic versioning (semver):

- `1.0.0` - Initial stable release
- `1.0.x` - Bug fixes
- `1.x.0` - New features (backward compatible)
- `x.0.0` - Breaking changes

Update version in both `jsr.json` and `deno.json` before publishing.

---

## Success Metrics

**The library is successful when:**

1. ✅ Rick's Lume config goes from 140 lines → 50 lines
2. ✅ Zero manual URL construction needed
3. ✅ IDE autocomplete works throughout
4. ✅ Error messages are actionable
5. ✅ Common operations are obvious
6. ✅ Complex operations are possible (with escape hatches)
7. ✅ Build time reduces due to caching (optional feature)
8. ✅ Published on JSR with good documentation
9. ✅ Other developers can easily install and use

---

## Next Steps

**Immediate actions:**

1. Choose package scope for JSR
2. Set up the project structure
3. Implement `TeamDeskClient` with basic request handling
4. Create a simple example that fetches data
5. Test against a real TeamDesk database

**First milestone:** A working example that replaces Rick's current fetch code
with the library, demonstrating immediate value.

**Publication milestone:**

- Clean, documented code
- Comprehensive README
- Working examples
- Published on JSR
- Announced to TeamDesk community

---

## Additional Resources

**TeamDesk API Documentation:**

- Main docs: https://www.teamdesk.net/help/rest-api/
- Formula language: https://www.teamdesk.net/help/working-with-formulas/
- Example implementations: PHP library at
  https://github.com/ForeSoftCorp/TeamDesk-RESTAPI-PHP

**JSR Documentation:**

- Getting started: https://jsr.io/docs
- Publishing guide: https://jsr.io/docs/publishing-packages
- Best practices: https://jsr.io/docs/best-practices

**Design Pattern References:**

- Martin Fowler on Fluent Interfaces
- Query builder patterns (Knex.js, TypeORM for inspiration)
- Deno best practices: https://deno.land/manual/examples

---

## Contact & Collaboration

This library is being built by Rick Cogley for use in Lume SSG projects, but
designed as a general-purpose tool for the TeamDesk community.

**Primary use case:** Static site generation with Lume\
**Target runtime:** Deno (with Node.js compatibility)\
**Design philosophy:** Developer experience first, comprehensive second\
**Distribution:** JSR (JavaScript Registry) first, npm optional

---

_Ready to build! Let's start with Phase 1: Core Foundation._

**First command:**

```bash
mkdir teamdesk-client && cd teamdesk-client
claude code
```

**First prompt for Claude Code:**

```
I want to build a TypeScript library for the TeamDesk REST API that will be published on JSR.

Context document: [paste URL of this conversation or upload this markdown]

Let's start by:
1. Setting up jsr.json and deno.json
2. Creating the basic project structure
3. Implementing a minimal TeamDeskClient that can fetch data
4. Testing it with a simple example

Keep the initial implementation minimal - we'll add the fluent API and advanced features iteratively.
```
