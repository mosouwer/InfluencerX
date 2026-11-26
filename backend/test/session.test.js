import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession} from '../public/session.js';
test('concurrent requests share one renewal',async()=>{
 let calls=0;
 const s=createSession(async()=>{calls++;return {access_token:'renewed',refresh_token:'new',expires_in:3600};},()=>100000);
 s.set({access_token:'old',refresh_token:'refresh',expires_at:110});
 assert.deepEqual(await Promise.all([s.access(),s.access()]),['renewed','renewed']);assert.equal(calls,1);
});
test('sign out during refresh cannot restore the session',async()=>{
 let finish;
 const s=createSession(()=>new Promise(resolve=>finish=resolve),()=>100000);
 s.set({access_token:'old',refresh_token:'refresh',expires_at:110});
 const pending=s.access();s.clear();finish({access_token:'renewed',expires_in:3600});
 await assert.rejects(pending,/Session changed/);await assert.rejects(s.access(),/sign in/);
});
