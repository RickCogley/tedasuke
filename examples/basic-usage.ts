/**
 * Basic usage example for TeDasuke
 * Demonstrates simple queries and view access
 */

import { TeamDeskClient } from "../mod.ts";

// Load environment variables
const appId = Deno.env.get("TD_APP_ID");
const token = Deno.env.get("TD_TOKEN");

if (!appId || !token) {
  console.error(
    "❌ Error: TD_APP_ID and TD_TOKEN environment variables required",
  );
  console.error("   Set them like this:");
  console.error("   export TD_APP_ID=15331");
  console.error('   export TD_TOKEN="your-api-token"');
  Deno.exit(1);
}

// Create client
const client = new TeamDeskClient({
  appId,
  token,
  debug: true, // Enable debug logging
  useBearerAuth: true, // Use Bearer token auth (recommended for security)
});

console.log("🔄 TeDasuke Basic Usage Example\n");

try {
  // Example 1: Get database schema
  console.log("📋 Getting database schema...");
  const schema = await client.describe();
  console.log(`✅ Found ${schema.tables.length} tables:`);
  schema.tables.forEach((table) => {
    console.log(`   - ${table.recordsName} (${table.columns.length} columns)`);
  });
  console.log();

  // Example 2: Simple select from first table
  if (schema.tables.length > 0) {
    const firstTable = schema.tables[0].recordsName;
    console.log(`📊 Fetching first 5 records from '${firstTable}'...`);

    const records = await client
      .table(firstTable)
      .select()
      .limit(5)
      .execute();

    console.log(`✅ Retrieved ${records.length} records`);
    if (records.length > 0) {
      console.log("   First record:", JSON.stringify(records[0], null, 2));
    }
    console.log();
  }

  // Example 3: Query with sorting
  if (schema.tables.length > 0) {
    const firstTable = schema.tables[0].recordsName;
    console.log(`📊 Fetching records with sorting...`);

    // Get first column name for sorting
    const firstColumn = schema.tables[0].columns[0]?.name;
    if (firstColumn) {
      const records = await client
        .table(firstTable)
        .select()
        .sort(firstColumn, "DESC")
        .limit(3)
        .execute();

      console.log(
        `✅ Retrieved ${records.length} records sorted by ${firstColumn}`,
      );
      console.log();
    }
  }

  console.log("✅ All examples completed successfully!");
} catch (error) {
  console.error("❌ Error:", error);
  Deno.exit(1);
}
