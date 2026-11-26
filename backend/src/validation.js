export function booking(body) {
 if (!body || typeof body !== 'object') throw new Error('Booking required');
 for (const key of ['title','brief','usage_rights']) if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > 10000) throw new Error(`Invalid ${key}`);
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.creator_id)) throw new Error('Invalid creator');
 if (!Number.isSafeInteger(body.amount_paise) || body.amount_paise <= 0) throw new Error('Invalid amount');
 if (!Number.isInteger(body.revision_limit) || body.revision_limit < 0 || body.revision_limit > 10) throw new Error('Invalid revision allowance');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) || !Number.isFinite(Date.parse(body.deadline)) || new Date(body.deadline).toISOString().slice(0,10) !== body.deadline || body.deadline < new Date().toISOString().slice(0,10)) throw new Error('Invalid deadline');
 if (!Array.isArray(body.deliverables) || !body.deliverables.length || body.deliverables.length > 30 || body.deliverables.some(x=>typeof x !== 'string' || !x.trim() || x.length > 2000)) throw new Error('Invalid deliverables');
 return body;
}
export function submissionUrl(value) {
 let url; try {url=new URL(value);} catch {throw new Error('Invalid submission URL');}
 if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 4000) throw new Error('Invalid submission URL');
 return url.href;
}
export const niches=['Fashion','Food','Travel','Fitness','Tech','Lifestyle','Beauty','Other'];
export function creatorProfile(body){
 if(!body || !niches.includes(body.niche))throw new Error('Choose a valid niche');
 for(const [key,max] of [['bio',2000],['location',120]])if(typeof body[key]!=='string' || body[key].length>max)throw new Error(`Invalid ${key}`);
 if(typeof body.available!=='boolean')throw new Error('Invalid availability');
 const rates={};
 for(const key of ['story','reel','post','youtube']){
  const value=body.rates?.[key];
  if(value!==null && (!Number.isSafeInteger(value) || value<=0 || value>10000000000))throw new Error('Rates must be positive integer paise, or null for unavailable packages');
  rates[key]=value;
 }
 return {niche:body.niche,bio:body.bio.trim(),location:body.location.trim(),available:body.available,rates};
}
export function feedback(value){
 if(typeof value!=='string' || !value.trim() || value.trim().length>4000)throw new Error('Enter feedback between 1 and 4000 characters');
 return value.trim();
}
