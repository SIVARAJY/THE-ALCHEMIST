require('dotenv').config();
const { Client } = require('pg');

async function executeMigration() {
  // Supabase DB connection string pattern using project ref
  const projectRef = 'llngpaswltxltfmkqnld';
  
  // Try standard direct database connection strings
  const connectionStrings = [
    `postgres://postgres:${process.env.SUPABASE_DB_PASSWORD || 'postgres'}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgres://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || 'postgres'}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
  ];

  const sql = `
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS requested_room_id UUID REFERENCES rooms(id);
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS venue_change_status TEXT;
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS venue_change_reason TEXT;
    ALTER TABLE meetings ADD COLUMN IF NOT EXISTS minutes_of_meeting TEXT;
    ALTER TABLE meetings ADD COLUMN IF NOT EXISTS mom_submitted_at TIMESTAMPTZ;
  `;

  for (const connStr of connectionStrings) {
    try {
      console.log('Connecting to postgres...');
      const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connected! Executing DDL...');
      await client.query(sql);
      console.log('DDL Migration Successful!');
      await client.end();
      return;
    } catch (e) {
      console.log('Conn failed:', e.message);
    }
  }
}

executeMigration();
