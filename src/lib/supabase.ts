import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'scrsa-sports-app',
    },
  },
});

// Optional connection test function - only run when explicitly called
export const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 10 chars):', supabaseAnonKey?.substring(0, 10) + '...');
    
    // Test basic connection with a simple query
    const { data, error, count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    } else {
      console.log('✅ Supabase connected successfully');
      console.log('Users table accessible, count:', count);
      
      // Test if we can read sports (should always work)
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('id', { count: 'exact', head: true });
        
      if (sportsError) {
        console.warn('⚠️ Sports table access issue:', sportsError);
      } else {
        console.log('✅ Sports table accessible, count:', sportsData);
      }
      return true;
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return false;
  }
};

// Make supabase available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).testSupabaseConnection = testConnection;
}