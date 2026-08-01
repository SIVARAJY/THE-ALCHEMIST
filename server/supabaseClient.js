const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const DEFAULT_URL = 'https://llngpaswltxltfmkqnld.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbmdwYXN3bHR4bHRmbWtxbmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU1MDMwOSwiZXhwIjoyMTAxMTI2MzA5fQ.OQJzXp-R18oAFODsJE6cO87yMqi3TmoqWB41_LW5qMU';

let supabaseUrl = process.env.SUPABASE_URL || DEFAULT_URL;
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  supabaseUrl = DEFAULT_URL;
}

let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || DEFAULT_KEY;
if (!supabaseKey || supabaseKey.includes('placeholder')) {
  supabaseKey = DEFAULT_KEY;
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
