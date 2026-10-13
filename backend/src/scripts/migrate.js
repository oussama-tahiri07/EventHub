const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  console.log('🔄 Running database migrations...');
  const initSqlPath = path.resolve(__dirname, '../../../database/init.sql');
  const sql = fs.readFileSync(initSqlPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('✅ Database schema initialized successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
