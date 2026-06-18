/* ============================================================
   The Moon Estate — configuration
   ------------------------------------------------------------
   To enable the SHARED online database (so every visitor sees
   the same listings), create a free project at supabase.com and
   paste your Project URL + anon public key below.

   Leave them blank to run in local-only demo mode (listings are
   saved per-browser). See supabase.sql for the table to create.
   ============================================================ */
window.TME_CONFIG = {
  // e.g. 'https://abcdxyz.supabase.co'
  SUPABASE_URL: 'https://bugvizmgryafdvpgwgab.supabase.co',
  // the "anon public" key from Project Settings → API
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z3Zpem1ncnlhZmR2cGd3Z2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjMzNTMsImV4cCI6MjA5NzI5OTM1M30.iXgjUJa-CRCSDGzRxI7aA9e23o9NKF3YLicY9kXlWSg',
  // the email of the business owner / admin (sees all listings + all leads).
  // Must match a user you created in Supabase → Authentication → Users.
  ADMIN_EMAIL: 'lucky05290@gmail.com',
  // Only used in LOCAL demo mode (no Supabase). When Supabase is connected,
  // the Admin panel uses a secure email + password login instead (create the
  // user in Supabase → Authentication → Users).
  ADMIN_PASSCODE: 'moon-admin'
};
