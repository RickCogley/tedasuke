/**
 * Test TeDasuke against Rick's actual PROdb database
 * Tests all the tables and views used in esolia-2025
 */

import { TeamDeskClient } from "../mod.ts";

const apiKey = Deno.env.get("PRODB15331TOKEN2411");

if (!apiKey) {
  console.error("❌ Error: PRODB15331TOKEN2411 environment variable required");
  console.error("   Set it like this:");
  console.error('   export PRODB15331TOKEN2411="your-token"');
  Deno.exit(1);
}

// Create client for PROdb
const td = new TeamDeskClient({
  appId: 15331,
  token: apiKey,
  baseUrl: "https://pro.dbflex.net/secure/api/v2",
  debug: true, // Show API calls for verification
  useBearerAuth: true, // Use Bearer token auth (recommended for security)
});

console.log("🔄 Testing TeDasuke against PROdb (App ID: 15331)\n");

try {
  // Test 1: Get database schema
  console.log("📋 Test 1: Getting database schema...");
  const schema = await td.describe();
  console.log(`✅ Found ${schema.tables.length} tables in database`);
  console.log("   Tables:", schema.tables.map((t) => t.recordsName).join(", "));
  console.log();

  // Test 2: Future holidays view
  console.log("📊 Test 2: Fetching future holidays...");
  const futureholidays = await td
    .table("Work Holiday")
    .view("API Holidays Today or Later")
    .select()
    .execute();
  console.log(`✅ futureholidays: ${futureholidays.length} records`);
  if (futureholidays.length > 0) {
    console.log("   First holiday:", futureholidays[0]);
  }
  console.log();

  // Test 3: Next holiday view
  console.log("📊 Test 3: Fetching next holiday...");
  const nextholiday = await td
    .table("Work Holiday")
    .view("API Holidays Next")
    .select()
    .execute();
  console.log(`✅ nextholiday: ${nextholiday.length} records`);
  if (nextholiday.length > 0) {
    console.log("   Next holiday:", nextholiday[0]);
  }
  console.log();

  // Test 4: Web Information - all
  console.log("📊 Test 4: Fetching all web information...");
  const webinfo = await td
    .table("Web Information")
    .view("API List All")
    .select()
    .execute();
  console.log(`✅ webinfo: ${webinfo.length} records`);
  console.log();

  // Test 5: Web Information - last 1
  console.log("📊 Test 5: Fetching last web info entry...");
  const webinfolast = await td
    .table("Web Information")
    .view("API List All")
    .select()
    .limit(1)
    .execute();
  console.log(`✅ webinfolast: ${webinfolast.length} records`);
  if (webinfolast.length > 0) {
    console.log("   Last entry:", webinfolast[0]);
  }
  console.log();

  // Test 6: Web Project - all
  console.log("📊 Test 6: Fetching all projects...");
  const projects = await td
    .table("Web Project")
    .view("API List All")
    .select()
    .execute();
  console.log(`✅ projects: ${projects.length} records`);
  console.log();

  // Test 7: Web Project - last 3
  console.log("📊 Test 7: Fetching last 3 projects...");
  const projectslast = await td
    .table("Web Project")
    .view("API List All")
    .select()
    .limit(3)
    .execute();
  console.log(`✅ projectslast: ${projectslast.length} records`);
  if (projectslast.length > 0) {
    console.log(
      "   Projects:",
      projectslast.map((p: Record<string, unknown>) =>
        p.Title || p.Name || "Untitled"
      ),
    );
  }
  console.log();

  // Test 8: Japan Contacts - direct table query (no view)
  console.log("📊 Test 8: Fetching Japan contacts...");
  const japancontacts = await td
    .table("Web Japan Contact and App")
    .select()
    .execute();
  console.log(`✅ japancontacts: ${japancontacts.length} records`);
  console.log();

  // Test 9: Test pagination with skip
  console.log("📊 Test 9: Testing pagination (skip/limit)...");
  const page1 = await td
    .table("Web Information")
    .view("API List All")
    .select()
    .skip(0)
    .limit(2)
    .execute();
  const page2 = await td
    .table("Web Information")
    .view("API List All")
    .select()
    .skip(2)
    .limit(2)
    .execute();
  console.log(`✅ Page 1: ${page1.length} records`);
  console.log(`✅ Page 2: ${page2.length} records`);
  console.log();

  // Summary
  console.log("=".repeat(60));
  console.log("🎉 ALL TESTS PASSED!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`   - futureholidays: ${futureholidays.length} records`);
  console.log(`   - nextholiday: ${nextholiday.length} records`);
  console.log(`   - webinfo: ${webinfo.length} records`);
  console.log(`   - webinfolast: ${webinfolast.length} records`);
  console.log(`   - projects: ${projects.length} records`);
  console.log(`   - projectslast: ${projectslast.length} records`);
  console.log(`   - japancontacts: ${japancontacts.length} records`);
  console.log("\n✅ TeDasuke is working perfectly with PROdb!");
  console.log(
    "\n💡 You can now replace the fetch boilerplate in esolia-2025/_config.ts",
  );
} catch (error) {
  console.error("\n❌ Test failed:");
  console.error(error);
  Deno.exit(1);
}
