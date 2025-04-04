import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client with custom headers and increased timeout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: fetch.bind(globalThis),
    headers: {
      'X-Client-Info': 'environ-frontend'
    }
  }
});

// Retry logic for Supabase queries with exponential backoff
const withRetry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff with max 10s
      console.warn(`Supabase: Retry ${i + 1}/${maxRetries} after error: ${err.message}. Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Test Supabase connection with a timeout
const testSupabaseConnection = async () => {
  try {
    console.log('Supabase: Testing connection...');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timed out after 10s')), 10000);
    });

    const connectionPromise = withRetry(() => 
      supabase
        .from('users')
        .select('id')
        .limit(1)
        .single()
    );

    const { error } = await Promise.race([connectionPromise, timeoutPromise]);

    if (error) {
      console.error('Supabase: Connection test failed:', error.message);
      return false;
    }
    console.log('Supabase: Connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase: Connection error:', err.message);
    return false;
  }
};

// Run the connection test
testSupabaseConnection();

export { supabase, withRetry };