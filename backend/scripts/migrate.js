import 'dotenv/config';
import pg from 'pg';
import {readdir,readFile} from 'node:fs/promises';
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try {
 await client.query('SELECT pg_advisory_lock(78349201)');
 await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 await client.query('ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY');
 const directory=new URL('../migrations/',import.meta.url);
 for(const name of (await readdir(directory)).filter(n=>n.endsWith('.sql')).sort()) {
  if((await client.query('SELECT name FROM schema_migrations WHERE name=$1',[name])).rowCount) continue;
  const sql=await readFile(new URL(name,directory),'utf8');
  await client.query('BEGIN');
  try {
   await client.query(sql.replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''));
   await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
   await client.query('COMMIT');console.log(`Applied ${name}`);
  }catch(error){await client.query('ROLLBACK');throw error;}
 }
}finally{await client.end();}
