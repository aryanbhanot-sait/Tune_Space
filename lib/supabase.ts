import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zazneocfcpjltirxgxui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphem5lb2NmY3BqbHRpcnhneHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NDA3MTUsImV4cCI6MjA2ODIxNjcxNX0._oOjczqBRB4UJ_IYIuCHgaNL9yKXAtP4tI9pux-7GaE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
