import { assertEquals, assertExists } from "jsr:@std/assert@1";
import {
  AuthenticationError,
  clearCache,
  fetchWithCache,
  getCacheInfo,
  loadFromCache,
  NotFoundError,
  RateLimitError,
  saveToCache,
  ServerError,
  TableClient,
  TeamDeskClient,
  TeamDeskError,
  ValidationError,
  ViewClient,
} from "../mod.ts";

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
  assertExists(fetchWithCache);
  assertExists(getCacheInfo);
  assertExists(saveToCache);
  assertExists(loadFromCache);
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
