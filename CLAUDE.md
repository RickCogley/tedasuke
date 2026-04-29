# TeDasuke - Project Context

## Overview

TeDasuke (手助け - "helping hand") is a fluent, type-safe TypeScript library for
the Foresoft TeamDesk (aka dbFLEX) REST API, designed to be published on JSR.

## Project Structure

```
tedasuke/
├── mod.ts                   # Main entry point (exports all public APIs)
├── deno.json               # Deno + JSR configuration (single source of truth)
├── README.md               # Comprehensive documentation
├── CLAUDE.md               # This file - project context
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # PR/main: fmt, lint, check, test, publish dry-run
│   │   ├── publish.yml               # Tag push (v*): publish to JSR
│   │   └── secrets-and-sast.yml      # Calls eSolia/devkit reusable security workflow
│   └── dependabot.yml                # Weekly github-actions updates
│
├── .claude/
│   └── rules/
│       └── change-management.md      # ISO 27001 issue-branch-PR-merge-verify workflow
│
├── src/
│   ├── cache.ts          # fetchWithCache fallback for build resilience
│   ├── client.ts          # TeamDeskClient - main API client
│   ├── table.ts           # TableClient, ViewClient, SelectBuilder
│   ├── types.ts           # TypeScript type definitions
│   ├── errors.ts          # Custom error classes
│   └── utils.ts           # Utility functions (URL encoding, etc.)
│
├── examples/
│   ├── basic-usage.ts     # Simple demonstration
│   ├── lume-integration.ts # Lume SSG use case example
│   └── test-prodb.ts      # Production DB smoke test
│
├── docs/
│   └── teamdesk-client-kickoff.md # Original design document
│
└── tests/                  # Test suite (TBD)
```

## Key Design Decisions

1. **Fluent API Pattern**: Method chaining for readable queries
   ```typescript
   client.table("Orders").select().filter('[Status]="Active"').execute();
   ```

2. **Type Safety**: Generic types throughout for autocomplete and compile-time
   checking

3. **Zero Dependencies**: Uses only Deno/Web standard APIs (fetch, URL, etc.)

4. **Builder Pattern**: SelectBuilder for complex queries with progressive
   disclosure

5. **Error Handling**: Rich error context with specific error types
   (AuthenticationError, ValidationError, etc.)

## Implementation Status

**Phase 1: Core Foundation** ✅ COMPLETED

- Project setup (jsr.json, deno.json)
- TeamDeskClient with authentication
- Basic HTTP request wrapper with error handling
- Type definitions
- TableClient with select/execute
- View support
- Examples demonstrating usage

**Ready for Testing**: Library can now fetch data from TeamDesk API

## Usage Patterns

### Basic Select

```typescript
const data = await client.table("Orders").select().execute();
```

### With View

```typescript
const data = await client.table("Orders").view("Active Orders").select()
  .execute();
```

### With Filtering, Sorting, Pagination

```typescript
const data = await client
  .table("Orders")
  .select(["OrderID", "Total"])
  .filter('[Status]="Active"')
  .sort("OrderDate", "DESC")
  .limit(100)
  .execute();
```

### Auto-pagination

```typescript
for await (const batch of client.table("Orders").select().selectAll()) {
  // Process batches of up to 500 records
}
```

### Write Operations

```typescript
// Create
await client.table("Clients").create([{ Name: "Acme" }]);

// Update (by @row.id — preferred)
await client.table("Clients").update([{ "@row.id": 123, Status: "Active" }]);

// Update (by key — converted to @row.id automatically)
await client.table("Clients").update([{ key: "123", Status: "Active" }]);

// Upsert
await client.table("Contacts").upsert([{
  Email: "john@example.com",
  Name: "John",
}], "Email");
```

## Testing Requirements

For API testing, we need:

1. TeamDesk/DBFlex API credentials (token)
2. A test table with:
   - Text columns
   - Number columns
   - Date columns
   - Boolean (checkbox) columns
3. A test view on that table
4. Sample data to query

## Next Steps

1. **Test with Real API**: Verify against actual TeamDesk instance
2. **Add Filter Builders** (Phase 4): Helper functions for type-safe filters
3. **Schema Introspection**: Describe table endpoints
4. **Change Tracking**: Updated/deleted endpoints
5. **Publish to JSR**: Once tested and validated

## Development Workflow

```bash
# Preflight checks (always run before commit)
deno task preflight  # Runs fmt, check, lint

# Run examples
deno task example

# Type check
deno task check

# Lint
deno task lint

# Format
deno task fmt

# Publish (dry-run — real publish runs in publish.yml on tag push)
deno task publish:dry
```

## Code Style

- Double quotes for strings (matches kickoff doc preference)
- Semicolons enabled
- Deno standard formatting
- JSDoc comments for all public APIs
- No `any` types (enforced by linting)

## API Endpoints Implemented

- ✅ `GET /describe.json` - Database schema
- ✅ `GET /{table}/select.json` - Select from table
- ✅ `GET /{table}/{view}/select.json` - Select from view
- ✅ `POST /{table}/create.json` - Create records
- ✅ `POST /{table}/update.json` - Update records
- ✅ `POST /{table}/upsert.json` - Upsert records
- ⏳ `GET /{table}/delete.json` - Delete records (TBD)
- ⏳ `GET /{table}/updated.json` - Change tracking (TBD)
- ⏳ `GET /{table}/deleted.json` - Change tracking (TBD)
- ⏳ `GET /{table}/describe.json` - Table schema (TBD)

## Important Notes

- TeamDesk API has a 500 record maximum per request
- Views must be URL-encoded (spaces become %20, etc.)
- Filter expressions use TeamDesk formula language (not SQL)
- Workflow rules are triggered by default (use `workflow: false` to disable)
- Response includes special `@row.id` and `@row.allow` properties
