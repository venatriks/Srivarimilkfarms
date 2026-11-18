import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Sanitize URL by stripping trailing /rest/v1 or trailing slashes if present
export const supabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : 'https://your-supabase-project.supabase.co';

export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const isSupabaseConfigured = () => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project')
  );
};

// Only public Supabase credentials are permitted in the browser.
function assertPublicSupabaseKey(key) {
  if (key.startsWith('sb_publishable_')) return;

  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(
        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
      );

      if (payload.role === 'anon') return;
    }
  } catch {
    // Reject invalid credential formats.
  }

  throw new Error('Invalid public Supabase configuration.');
}

assertPublicSupabaseKey(supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
