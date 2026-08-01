const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://llngpaswltxltfmkqnld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbmdwYXN3bHR4bHRmbWtxbmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU1MDMwOSwiZXhwIjoyMTAxMTI2MzA5fQ.OQJzXp-R18oAFODsJE6cO87yMqi3TmoqWB41_LW5qMU';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
