// Adds the bundled seed data (exported from db/aju_bot.db) to Supabase. Rows that already
// exist are never overwritten, so real approvals and edits are kept.
// Usage: npm run db:seed   (apply supabase/migrations first: push to main, or paste into the SQL Editor)
// Uses the secret key, so it only ever runs on your machine, never in the browser.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_FACULTY, INITIAL_LEAVE_REQUESTS } from '../src/data/mockData';
import { facultyToRow, leaveToRow } from '../src/lib/supabase';

const url = process.env.VITE_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false } });

const run = async () => {
  const faculty = await db.from('faculty').upsert(INITIAL_FACULTY.map(facultyToRow), { onConflict: 'id', ignoreDuplicates: true });
  if (faculty.error) throw new Error(`faculty: ${faculty.error.message}`);
  console.log(`faculty: ${INITIAL_FACULTY.length} seed rows checked (existing rows left unchanged)`);

  const leave = await db.from('leave_requests').upsert(INITIAL_LEAVE_REQUESTS.map(leaveToRow), { onConflict: 'id', ignoreDuplicates: true });
  if (leave.error) throw new Error(`leave_requests: ${leave.error.message}`);
  console.log(`leave_requests: ${INITIAL_LEAVE_REQUESTS.length} seed rows checked (existing rows left unchanged)`);
};

run().catch((err) => {
  console.error(err.message);
  if (/relation .* does not exist|Could not find the table/i.test(err.message)) {
    console.error('Tables are missing: push supabase/migrations to main, or paste the migration into the Supabase SQL Editor.');
  }
  process.exitCode = 1;
});
