import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

// Initialize Supabase client with custom headers and increased timeout
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  headers: {
    'Accept': 'application/json',
  },
  db: {
    fetchTimeout: 10000, // Increase timeout to 10 seconds
  },
});

// Retry logic for Supabase queries
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Supabase: Retry ${i + 1}/${retries} after error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Test Supabase connection with a timeout
const testSupabaseConnection = async () => {
  try {
    console.log('Supabase: Testing connection...');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase connection test timed out after 10 seconds')), 10000);
    });

    const connectionPromise = withRetry(() => supabase.from('users').select('id').limit(1));
    const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);

    if (error) {
      console.error('Supabase: Connection test failed:', error.message);
      throw error;
    }
    console.log('Supabase: Connection test successful');
  } catch (err) {
    console.error('Supabase: Unexpected error during connection test:', err.message);
    // Don't throw here, just log the error
  }
};

// Run the connection test
testSupabaseConnection();

export { supabase, withRetry };