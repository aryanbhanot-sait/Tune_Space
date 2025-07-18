import { createClient } from '@supabase/supabase-js';

// const url_key = process.env.EXPO_PUBLIC_URL;
// const anon_key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const url_key = 'https://zazneocfcpjltirxgxui.supabase.co';
const anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphem5lb2NmY3BqbHRpcnhneHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NDA3MTUsImV4cCI6MjA2ODIxNjcxNX0._oOjczqBRB4UJ_IYIuCHgaNL9yKXAtP4tI9pux-7GaE'

export const supabase = createClient(url_key, anon_key);
