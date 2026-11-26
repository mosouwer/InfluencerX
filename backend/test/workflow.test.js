import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transition} from '../src/workflow.js';
const row={brand_id:'b',creator_id:'c',status:'proposed'};
test('acceptance requires creator ownership',()=>{
 assert.equal(transition(row,{id:'c',role:'influencer'},'accept'),'awaiting_payment');
 assert.throws(()=>transition(row,{id:'other',role:'influencer'},'accept'),/Forbidden/);
});
test('clients cannot mark payment confirmed',()=>assert.throws(()=>transition(row,{id:'b',role:'brand'},'fund'),/Invalid/));
test('completion cannot be repeated',()=>assert.throws(()=>transition({...row,status:'completed'},{id:'b',role:'brand'},'approve'),/Invalid/));
test('creator cannot approve own work',()=>assert.throws(()=>transition({...row,status:'review'},{id:'c',role:'influencer'},'approve'),/Invalid/));
