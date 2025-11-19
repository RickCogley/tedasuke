/**
 * Lume SSG Integration Example
 * Demonstrates how to use TeDasuke with Lume static site generator
 * This replaces the manual fetch boilerplate shown in the kickoff doc
 */

import { TeamDeskClient } from "../mod.ts";

// This is how you'd use it in your Lume _config.ts or _data files

const apiKey = Deno.env.get("API_KEY_01");

if (!apiKey) {
  console.error("❌ API_KEY_01 not found");
  throw new Error("API_KEY_01 environment variable required");
}

// Create client instance
const td = new TeamDeskClient({
  appId: 15331,
  token: apiKey,
  baseUrl: "https://pro.dbflex.net/secure/api/v2", // Using DBFlex URL
});

console.log("🔄 Fetching PROdb data for Lume...");

// In your actual Lume _data file, you would use top-level await exports like this:
// export const futureholidays = await td.table("Work Holiday").view("API Holidays Today or Later").select().execute();

// For this example, we'll fetch and demonstrate the data
async function fetchAllData() {
  // Fetch future holidays
  const futureholidays = await td
    .table("Work Holiday")
    .view("API Holidays Today or Later")
    .select()
    .execute();

  console.log(`✅ futureholidays: ${futureholidays.length} records`);

  // Fetch next holiday
  const nextholiday = await td
    .table("Work Holiday")
    .view("API Holidays Next")
    .select()
    .execute();

  console.log(`✅ nextholiday: ${nextholiday.length} records`);

  // Fetch all web info
  const webinfo = await td
    .table("Web Information")
    .view("API List All")
    .select()
    .execute();

  console.log(`✅ webinfo: ${webinfo.length} records`);

  // Fetch last web info entry
  const webinfolast = await td
    .table("Web Information")
    .view("API List All")
    .select()
    .limit(1)
    .execute();

  console.log(`✅ webinfolast: ${webinfolast.length} records`);

  // Fetch all projects
  const projects = await td
    .table("Web Project")
    .view("API List All")
    .select()
    .execute();

  console.log(`✅ projects: ${projects.length} records`);

  // Fetch last 3 projects
  const projectslast = await td
    .table("Web Project")
    .view("API List All")
    .select()
    .limit(3)
    .execute();

  console.log(`✅ projectslast: ${projectslast.length} records`);

  // Fetch Japan contacts
  const japancontacts = await td
    .table("Web Japan Contact and App")
    .select()
    .execute();

  console.log(`✅ japancontacts: ${japancontacts.length} records`);

  return {
    futureholidays,
    nextholiday,
    webinfo,
    webinfolast,
    projects,
    projectslast,
    japancontacts,
  };
}

try {
  const data = await fetchAllData();

  console.log("\n✅ All PROdb data fetched successfully");

  // Optional: Write to JSON files for Lume
  // (In your actual Lume config, you'd just export these directly)
  const dataDir = "./examples/_data";
  await Deno.mkdir(dataDir, { recursive: true });

  await Deno.writeTextFile(
    `${dataDir}/futureholidays.json`,
    JSON.stringify(data.futureholidays, null, 2),
  );
  await Deno.writeTextFile(
    `${dataDir}/nextholiday.json`,
    JSON.stringify(data.nextholiday, null, 2),
  );
  await Deno.writeTextFile(
    `${dataDir}/webinfo.json`,
    JSON.stringify(data.webinfo, null, 2),
  );
  await Deno.writeTextFile(
    `${dataDir}/webinfolast.json`,
    JSON.stringify(data.webinfolast, null, 2),
  );
  await Deno.writeTextFile(
    `${dataDir}/projects.json`,
    JSON.stringify(data.projects, null, 2),
  );
  await Deno.writeTextFile(
    `${dataDir}/projectslast.json`,
    JSON.stringify(data.projectslast, null, 2),
  );
  await Deno.writeTextFile(
    `${dataDir}/japancontacts.json`,
    JSON.stringify(data.japancontacts, null, 2),
  );

  console.log(`✅ JSON files written to ${dataDir}/`);
} catch (error) {
  console.error("❌ Error fetching PROdb data:", error);
  throw error;
}
