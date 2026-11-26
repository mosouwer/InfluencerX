import express from 'express';
import {fileURLToPath} from 'node:url';
import {transition} from './workflow.js';
import {booking,submissionUrl} from './validation.js';
export function createApp({pool,verifyToken,authConfig}) {
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'128kb'}));
app.get('/ready',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true});}catch{res.status(503).json({ok:false});}});
app.get('/health', (_req,res)=>res.json({ok:true}));
if(authConfig){
 app.get('/auth-config',(_req,res)=>res.json(authConfig));
 app.use(express.static(fileURLToPath(new URL('../public',import.meta.url))));
}
app.use(async(req,res,next)=>{
 try {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({error:'Authentication required'});
  const payload = await verifyToken(token);
  if (!/^[0-9a-f-]{36}$/i.test(payload.sub || '')) throw new Error('Invalid subject');
  req.identity = payload.sub;
 } catch {return res.status(401).json({error:'Invalid authentication'});}
 next();
});
app.put('/api/v2/profile',async(req,res,next)=>{
 const {role,display_name}=req.body || {};
 if(!['brand','influencer'].includes(role) || typeof display_name!=='string' || !display_name.trim() || display_name.length>120) return res.status(400).json({error:'Valid role and display name required'});
 try {
  const {rows}=await pool.query(`INSERT INTO profiles(id,role,display_name) VALUES($1,$2,$3)
   ON CONFLICT(id) DO UPDATE SET display_name=EXCLUDED.display_name WHERE profiles.role=EXCLUDED.role RETURNING *`,[req.identity,role,display_name.trim()]);
  if(!rows.length)return res.status(409).json({error:'Account role cannot be changed'});
  res.json(rows[0]);
 }catch(e){next(e);}
});
app.use(async(req,res,next)=>{
 try {
  const {rows}=await pool.query('SELECT id,role,display_name FROM profiles WHERE id=$1',[req.identity]);
  if(!rows[0])return res.status(403).json({error:'Profile required'});
  req.actor=rows[0];next();
 }catch(e){next(e);}
});
app.get('/api/v2/creators',async(req,res,next)=>{
 try {
  const search=typeof req.query.search==='string'?req.query.search.slice(0,120):'';
  const {rows}=await pool.query("SELECT id,display_name FROM profiles WHERE role='influencer' AND display_name ILIKE $1 ORDER BY display_name,id LIMIT 100",['%'+search+'%']);
  res.json(rows);
 }catch(e){next(e);}
});
app.get('/api/v2/me',(req,res)=>res.json(req.actor));
app.param('id',(req,res,next,value)=>/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)?next():res.status(400).json({error:'Invalid collaboration ID'}));
app.param('deliverableId',(req,res,next,value)=>/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)?next():res.status(400).json({error:'Invalid deliverable ID'}));
app.get('/api/v2/collaborations/:id',async(req,res,next)=>{
 try {
  const {rows}=await pool.query('SELECT * FROM collaborations WHERE id=$1 AND (brand_id=$2 OR creator_id=$2)',[req.params.id,req.actor.id]);
  if(!rows.length)return res.status(404).json({error:'Not found'});
  const deliverables=await pool.query('SELECT * FROM deliverables WHERE collaboration_id=$1 ORDER BY id',[req.params.id]);
  const submissions=await pool.query('SELECT s.* FROM submissions s JOIN deliverables d ON d.id=s.deliverable_id WHERE d.collaboration_id=$1 ORDER BY s.created_at,s.id',[req.params.id]);
  const events=await pool.query('SELECT * FROM collaboration_events WHERE collaboration_id=$1 ORDER BY id',[req.params.id]);
  res.json({...rows[0],deliverables:deliverables.rows,submissions:submissions.rows,events:events.rows});
 }catch(e){next(e);}
});
app.get('/api/v2/collaborations',async(req,res,next)=>{
 try {const {rows}=await pool.query('SELECT * FROM collaborations WHERE brand_id=$1 OR creator_id=$1 ORDER BY created_at DESC LIMIT 100',[req.actor.id]);res.json(rows);}catch(e){next(e);}
});
app.post('/api/v2/collaborations',async(req,res,next)=>{
 if(req.actor.role !== 'brand') return res.status(403).json({error:'Brand account required'});
 let data; try {data=booking(req.body);}catch(e){return res.status(400).json({error:e.message});}
 let client;
 try {
  client=await pool.connect(); await client.query('BEGIN');
  const creator=await client.query("SELECT id FROM profiles WHERE id=$1 AND role='influencer'",[data.creator_id]);
  if(!creator.rowCount){await client.query('ROLLBACK');return res.status(400).json({error:'Creator not found'});}
  const {rows}=await client.query(`INSERT INTO collaborations(brand_id,creator_id,title,brief,amount_paise,deadline,usage_rights,revision_limit)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[req.actor.id,data.creator_id,data.title,data.brief,data.amount_paise,data.deadline,data.usage_rights,data.revision_limit]);
  for(const description of data.deliverables) await client.query('INSERT INTO deliverables(collaboration_id,description) VALUES($1,$2)',[rows[0].id,description]);
  await client.query("INSERT INTO collaboration_events(collaboration_id,actor_id,action) VALUES($1,$2,'propose')",[rows[0].id,req.actor.id]);
  await client.query('COMMIT');res.status(201).json(rows[0]);
 }catch(e){if(client)await client.query('ROLLBACK');next(e);}finally{client?.release();}
});
app.put('/api/v2/collaborations/:id/deliverables/:deliverableId',async(req,res,next)=>{
 let url;try{url=submissionUrl(req.body?.url);}catch(e){return res.status(400).json({error:e.message});}
 let client;
 try{
  client=await pool.connect();await client.query('BEGIN');
  const {rows}=await client.query('SELECT * FROM collaborations WHERE id=$1 FOR UPDATE',[req.params.id]);
  const row=rows[0];
  if(!row || row.creator_id!==req.actor.id || req.actor.role!=='influencer'){await client.query('ROLLBACK');return res.status(403).json({error:'Forbidden'});}
  if(!['active','revision'].includes(row.status)){await client.query('ROLLBACK');return res.status(409).json({error:'Submission unavailable in this state'});}
  const result=await client.query('UPDATE deliverables SET submission_url=$1 WHERE id=$2 AND collaboration_id=$3 RETURNING *',[url,req.params.deliverableId,row.id]);
  if(!result.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'Deliverable not found'});}
  await client.query('INSERT INTO submissions(deliverable_id,url) VALUES($1,$2)',[req.params.deliverableId,url]);
  await client.query('COMMIT');res.json(result.rows[0]);
 }catch(e){if(client)await client.query('ROLLBACK');next(e);}finally{client?.release();}
});
app.post('/api/v2/collaborations/:id/actions',async(req,res,next)=>{
 let client;
 try {
  client=await pool.connect();
  await client.query('BEGIN');
  const {rows}=await client.query('SELECT * FROM collaborations WHERE id=$1 FOR UPDATE',[req.params.id]);
  const row=rows[0];
  if (!row) {await client.query('ROLLBACK');return res.status(404).json({error:'Not found'});}
  let status;
  try {status=transition(row,req.actor,req.body?.action);}catch(e){await client.query('ROLLBACK');return res.status(e.message==='Forbidden'?403:409).json({error:e.message});}
  if (['submit','resubmit','approve'].includes(req.body?.action)) {
   const check=await client.query('SELECT count(*)::integer AS total,count(submission_url)::integer AS submitted FROM deliverables WHERE collaboration_id=$1',[row.id]);
   if(!check.rows[0].total || check.rows[0].total!==check.rows[0].submitted){await client.query('ROLLBACK');return res.status(409).json({error:'Submit every deliverable first'});}
  }
  if(req.body?.action==='request_revision') {
   if(row.revisions_used>=row.revision_limit){await client.query('ROLLBACK');return res.status(409).json({error:'Revision allowance exhausted'});}
   await client.query('UPDATE collaborations SET revisions_used=revisions_used+1 WHERE id=$1',[row.id]);
   await client.query('UPDATE deliverables SET submission_url=NULL WHERE collaboration_id=$1',[row.id]);
  }
  if(req.body?.action==='approve') await client.query('UPDATE deliverables SET approved_at=now() WHERE collaboration_id=$1',[row.id]);
  const result=await client.query('UPDATE collaborations SET status=$1,version=version+1 WHERE id=$2 RETURNING *',[status,row.id]);
  await client.query('INSERT INTO collaboration_events(collaboration_id,actor_id,action) VALUES($1,$2,$3)',[row.id,req.actor.id,req.body?.action]);
  await client.query('COMMIT');res.json(result.rows[0]);
 }catch(e){if(client)await client.query('ROLLBACK');next(e);}finally{client?.release();}
});
app.use((err,_req,res,_next)=>{
 const status=err.type==='entity.parse.failed'?400:err.type==='entity.too.large'?413:500;
 res.status(status).json({error:status===500?'Request failed':'Invalid request body'});
});
return app;
}
