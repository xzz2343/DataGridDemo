/**
 * One-time script to seed the Supabase `people` table with 10,000 records.
 *
 * Prerequisites:
 *   1. Create the table in Supabase SQL editor:
 *
 *        create table people (
 *          id bigint primary key,
 *          first_name text not null,
 *          last_name  text not null,
 *          email      text not null,
 *          phone      text not null,
 *          office     text not null,
 *          city       text not null,
 *          state      text not null,
 *          role       text not null,
 *          title      text not null
 *        );
 *
 *        alter table people enable row level security;
 *
 *        create policy "Allow public read" on people
 *          for select using (true);
 *
 *   2. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local
 *   3. Run:  npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { PEOPLE_DATA } from "../data/people";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const BATCH = 500;

async function seed() {
  console.log(`Seeding ${PEOPLE_DATA.length} records in batches of ${BATCH}…`);

  for (let i = 0; i < PEOPLE_DATA.length; i += BATCH) {
    const batch = PEOPLE_DATA.slice(i, i + BATCH).map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      email: p.email,
      phone: p.phone,
      office: p.office,
      city: p.city,
      state: p.state,
      role: p.role,
      title: p.title,
    }));

    const { error } = await supabase.from("people").insert(batch);
    if (error) {
      console.error(`Failed on batch starting at row ${i + 1}:`, error.message);
      process.exit(1);
    }

    console.log(
      `  ✓ rows ${i + 1}–${Math.min(i + BATCH, PEOPLE_DATA.length)}`
    );
  }

  console.log("Seed complete.");
}

seed();
