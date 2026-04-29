import { assertEquals, assertExists } from "jsr:@std/assert@1";
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TableClient,
  TeamDeskClient,
  TeamDeskError,
  ValidationError,
  ViewClient,
} from "../mod.ts";
import {
  clearCache,
  fetchWithCache,
  getCacheInfo,
  loadFromCache,
  saveToCache,
} from "../src/cache.ts";

Deno.test("public API surface — main entry exports are present", () => {
  assertExists(TeamDeskClient);
  assertExists(TableClient);
  assertExists(ViewClient);
  assertExists(TeamDeskError);
  assertExists(AuthenticationError);
  assertExists(NotFoundError);
  assertExists(RateLimitError);
  assertExists(ServerError);
  assertExists(ValidationError);
});

Deno.test("public API surface — main entry does NOT export cache helpers", async () => {
  const main = await import("../mod.ts");
  assertEquals(
    "fetchWithCache" in main,
    false,
    "fetchWithCache must live in @rick/tedasuke/cache, not the main entry",
  );
  assertEquals("saveToCache" in main, false);
  assertEquals("loadFromCache" in main, false);
  assertEquals("getCacheInfo" in main, false);
  assertEquals("clearCache" in main, false);
});

Deno.test("cache entry — exports are present", () => {
  assertExists(fetchWithCache);
  assertExists(saveToCache);
  assertExists(loadFromCache);
  assertExists(getCacheInfo);
  assertExists(clearCache);
});

Deno.test("TeamDeskClient — constructs with required config", () => {
  const client = new TeamDeskClient({
    appId: 12345,
    token: "test-token",
  });
  assertExists(client);
});

Deno.test("TeamDeskClient — table() returns a TableClient", () => {
  const client = new TeamDeskClient({
    appId: 12345,
    token: "test-token",
  });
  const table = client.table("Orders");
  assertEquals(table instanceof TableClient, true);
});

Deno.test("TeamDeskError — preserves message and is throwable", () => {
  const err = new TeamDeskError("boom");
  assertEquals(err.message, "boom");
  assertEquals(err instanceof Error, true);
});
