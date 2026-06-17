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
  SUPABASE_URL: '',
  // the "anon public" key from Project Settings → API
  SUPABASE_ANON_KEY: '',
  // change this — used to open the Admin panel (footer → Admin)
  ADMIN_PASSCODE: 'moon-admin'
};
