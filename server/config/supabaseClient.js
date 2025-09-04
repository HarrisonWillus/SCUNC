const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 SUPABASE: Initializing client with service role...');
console.log('🌐 URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('🔑 Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE: Missing environment variables!');
    console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
console.log('✅ SUPABASE: Client created successfully with service role');

module.exports = supabase;