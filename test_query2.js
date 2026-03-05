require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: leadsData, error: leadsError } = await db.from('leads').select('*, lead_tags(tags(*))').limit(1);
    console.log('Result:', JSON.stringify({ error: leadsError, data: leadsData }, null, 2));
}
run();
