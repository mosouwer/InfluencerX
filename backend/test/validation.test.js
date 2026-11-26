import {test} from 'node:test';
import assert from 'node:assert/strict';
import {booking,submissionUrl} from '../src/validation.js';
const valid={title:'Launch',brief:'Create a reel',usage_rights:'Organic repost for 30 days',creator_id:'11111111-1111-4111-8111-111111111111',amount_paise:100000,revision_limit:1,deadline:'2099-01-01',deliverables:['One reel']};
test('accepts an explicit agreement',()=>assert.equal(booking(valid),valid));
test('rejects invalid prices and incomplete agreements',()=>{
 for(const patch of [{amount_paise:-1},{amount_paise:1.2},{deliverables:[]},{revision_limit:-1},{usage_rights:''},{deadline:'2099-02-30'}]) assert.throws(()=>booking({...valid,...patch}));
});
test('submission links require HTTPS and exclude embedded credentials',()=>{
 assert.equal(submissionUrl('https://example.com/video'),'https://example.com/video');
 for(const value of ['javascript:alert(1)','http://example.com','https://user:password@example.com'])assert.throws(()=>submissionUrl(value));
});
