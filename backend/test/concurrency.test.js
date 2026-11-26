import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {createApp} from '../src/app.js';
test('PostgreSQL concurrent approvals commit exactly one event',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const schema='test_'+randomUUID().replaceAll('-','');
 const admin=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema},public`,max:5});
 let server;
 try{
  for(const file of ['001_initial.sql','002_agreement.sql','003_api_access.sql','004_creator_profiles.sql','005_collaboration_feedback.sql'])await pool.query(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));
  const brand=randomUUID(),creator=randomUUID();
  await pool.query("INSERT INTO profiles(id,role,display_name) VALUES($1,'brand','Brand'),($2,'influencer','Creator')",[brand,creator]);
  const {rows}=await pool.query("INSERT INTO collaborations(brand_id,creator_id,title,brief,amount_paise,deadline,status) VALUES($1,$2,'Test','Test',10000,'2099-01-01','review') RETURNING id",[brand,creator]);
  const id=rows[0].id;
  await pool.query("INSERT INTO deliverables(collaboration_id,description,submission_url) VALUES($1,'Reel','https://example.com/reel')",[id]);
  server=createApp({pool,verifyToken:async()=>({sub:brand})}).listen(0,'127.0.0.1');
  await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
  const approve=()=>fetch(`http://127.0.0.1:${server.address().port}/api/v2/collaborations/${id}/actions`,{method:'POST',headers:{authorization:'Bearer fixture','content-type':'application/json'},body:JSON.stringify({action:'approve'})});
  const results=await Promise.all([approve(),approve(),approve()]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409,409]);
  const events=await pool.query("SELECT count(*)::integer AS count FROM collaboration_events WHERE action='approve'");
  assert.equal(events.rows[0].count,1);
 }finally{
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();
 }
});
