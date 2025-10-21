import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
// ALWAYS use VITE_SUPABASE_ANON_KEY (the JWT token from Legacy API Keys tab)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,   // ENABLED: Auto refresh tokens
    persistSession: true,       // ENABLED: Persist sessions
    detectSessionInUrl: true,   // ENABLED: Process OAuth callbacks
    flowType: 'pkce',
    redirectTo: 'https://garage-sale-40afc1f5.vercel.app/marketplace'
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'An error occurred');
  }
};

