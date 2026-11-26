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
