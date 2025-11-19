# TeDasuke Error Handling Guide

## Overview

TeDasuke provides comprehensive error handling for TeamDesk API interactions.
This guide covers common failure scenarios and best practices for handling them.

## Error Types

TeDasuke includes specific error classes for different failure scenarios:

```typescript
import {
  AuthenticationError, // 401, 403 errors
  NotFoundError, // 404 errors
  RateLimitError, // 429 errors
  ServerError, // 500+ errors
  TeamDeskError, // Base error class
  ValidationError, // 400, 422 errors
} from "jsr:@rick/tedasuke";
```

## Common Error Scenarios

### 1. API Unavailable (Network Errors)

When the API is completely unavailable (DNS failure, network down, server
offline):

```typescript
try {
  const data = await client.table("Orders").select().execute();
} catch (error) {
  if (error instanceof TeamDeskError) {
    console.error("API Error:", error.message);
    // Handle gracefully - use cached data, retry, or fail gracefully
  }
}
```

**Error message**:
`error sending request for url (...): dns error: failed to lookup address information`

### 2. Authentication Failures

Invalid token or insufficient permissions:

```typescript
try {
  const data = await client.table("Orders").select().execute();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
    console.error("Status:", error.status); // 401 or 403
    // Check your token or credentials
  }
}
```

### 3. Invalid Table or View Names

Attempting to access non-existent resources:

```typescript
try {
  const data = await client.table("NonExistent").select().execute();
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation error:", error.message);
    console.error("Status:", error.status); // 400
    // Typical messages: "Table does not exist", "View does not exist"
  }
}
```

### 4. Rate Limiting

Too many requests in a short period:

```typescript
try {
  const data = await client.table("Orders").select().execute();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded");
    console.error("Retry after:", error.retryAfter, "seconds");
    // Wait before retrying
  }
}
```

## Best Practices for Production

### Strategy 1: Fallback to Cached Data

Recommended for static site generators like Lume where API unavailability
shouldn't block builds:

```typescript
import { TeamDeskClient, TeamDeskError } from "jsr:@rick/tedasuke";

async function fetchWithFallback() {
  try {
    // Try to fetch fresh data
    const data = await client.table("Orders").select().execute();

    // Save to cache
    await Deno.writeTextFile(
      "cache/orders.json",
      JSON.stringify(data, null, 2),
    );

    return data;
  } catch (error) {
    console.warn("⚠️  API unavailable, using cached data");

    // Load from cache
    const cached = await Deno.readTextFile("cache/orders.json");
    return JSON.parse(cached);
  }
}
```

### Strategy 2: Retry with Exponential Backoff

For temporary network issues:

```typescript
async function fetchWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.table("Orders").select().execute();
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last attempt

      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### Strategy 3: Graceful Degradation

Show partial content when API fails:

```typescript
let orders = [];
let isLiveData = false;

try {
  orders = await client.table("Orders").select().execute();
  isLiveData = true;
} catch (error) {
  console.warn("Using fallback data");
  orders = []; // Empty or static fallback data
}

// Template can check isLiveData flag
export { isLiveData, orders };
```

## Lume SSG Integration Example

Complete example with fallback caching for Lume:

```typescript
// src/_data/prodb.ts
import { TeamDeskClient, TeamDeskError } from "jsr:@rick/tedasuke";

const td = new TeamDeskClient({
  appId: 15331,
  token: Deno.env.get("API_KEY_01")!,
  baseUrl: "https://pro.dbflex.net/secure/api/v2",
});

async function fetchData() {
  const cacheDir = "src/_data/_tdcache";

  try {
    // Fetch fresh data
    const data = await Promise.all([
      td.table("Work Holiday").view("API Holidays").select().execute(),
      td.table("Web Information").view("API List All").select().execute(),
      // ... more queries
    ]);

    // Save to cache
    await Deno.mkdir(cacheDir, { recursive: true });
    await Deno.writeTextFile(
      `${cacheDir}/data.json`,
      JSON.stringify(data, null, 2),
    );

    console.log("✅ Fresh data fetched");
    return data;
  } catch (error) {
    console.warn("⚠️  API unavailable, using cache");

    try {
      const cached = await Deno.readTextFile(`${cacheDir}/data.json`);
      return JSON.parse(cached);
    } catch {
      throw new Error("No cached data available");
    }
  }
}

const [holidays, webinfo] = await fetchData();

export { holidays, webinfo };
```

## Environment-Specific Handling

### Development

Fail fast to catch issues:

```typescript
const data = await client.table("Orders").select().execute();
// Let errors bubble up
```

### Production/CI

Use fallback with warnings:

```typescript
try {
  const data = await client.table("Orders").select().execute();
} catch (error) {
  if (Deno.env.get("CI") === "true") {
    console.warn("Using cached data in CI");
    // Load cache
  } else {
    throw error; // Fail in dev
  }
}
```

## Monitoring and Logging

Log errors for debugging:

```typescript
try {
  const data = await client.table("Orders").select().execute();
} catch (error) {
  if (error instanceof TeamDeskError) {
    console.error({
      type: error.constructor.name,
      message: error.message,
      status: error.status,
      url: error.url,
      timestamp: new Date().toISOString(),
    });
  }
  throw error;
}
```

## Summary

**For Lume SSG and similar build-time usage:**

- ✅ Use cached fallback data
- ✅ Log warnings when using cache
- ✅ Save successful fetches to cache
- ✅ Add `_tdcache/` to `.gitignore`

**For real-time applications:**

- ✅ Use retry logic with exponential backoff
- ✅ Show user-friendly error messages
- ✅ Implement rate limit handling
- ✅ Monitor error rates

**Always:**

- ✅ Use specific error types for targeted handling
- ✅ Log errors with context for debugging
- ✅ Test failure scenarios during development
