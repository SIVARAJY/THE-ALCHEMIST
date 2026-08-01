const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const DEFAULT_URL = 'https://llngpaswltxltfmkqnld.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbmdwYXN3bHR4bHRmbWtxbmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU1MDMwOSwiZXhwIjoyMTAxMTI2MzA5fQ.OQJzXp-R18oAFODsJE6cO87yMqi3TmoqWB41_LW5qMU';

const supabaseUrl = (process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('http') && !process.env.SUPABASE_URL.includes('placeholder')) 
  ? process.env.SUPABASE_URL 
  : DEFAULT_URL;

const supabaseKey = (process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_KEY.length > 30 && !process.env.SUPABASE_SERVICE_KEY.includes('placeholder')) 
  ? process.env.SUPABASE_SERVICE_KEY 
  : DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
