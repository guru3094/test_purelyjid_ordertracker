import test from 'node:test';
import assert from 'node:assert/strict';
import { canvaRequest, CanvaApiError, retryAfterSeconds } from '../lib/canva/request.mjs';
const response=(status,body,headers={})=>new Response(JSON.stringify(body),{status,headers});
test('temporary throttling respects Retry-After and preserves POST body',async()=>{
 let calls=0;const waits=[];const body={data:{VINYL_TEXT:{text:'Test'}}};
 const result=await canvaRequest('test','/autofills',body,{sleep:async ms=>{waits.push(ms)},fetchImpl:async(url,init)=>{assert.equal(JSON.parse(init.body).data.VINYL_TEXT.text,'Test');return ++calls===1?response(429,{code:'too_many_requests'},{'Retry-After':'3'}):response(200,{job:{id:'ok'}})}});
 assert.equal(result.job.id,'ok');assert.deepEqual(waits,[3000]);assert.equal(calls,2);
});
test('quota exhaustion fails immediately and does not recommend reconnecting',async()=>{
 let calls=0;await assert.rejects(canvaRequest('test','/autofills',{}, {fetchImpl:async()=>{calls++;return response(429,{code:'quota_exceeded'})}}),e=>e instanceof CanvaApiError&&e.quotaExceeded&&e.message.includes('Reconnecting will not reset'));assert.equal(calls,1);
});
test('long provider cooldown is returned without early retry',async()=>{
 let calls=0;await assert.rejects(canvaRequest('test','/exports',{}, {fetchImpl:async()=>{calls++;return response(429,{code:'too_many_requests'},{'Retry-After':'60'})}}),e=>e.retryAfterSeconds===60);assert.equal(calls,1);
});
test('retry count is bounded and network failures never replay POST jobs',async()=>{
 let calls=0;await assert.rejects(canvaRequest('test','/autofills',{}, {sleep:async()=>{},fetchImpl:async()=>{calls++;return response(429,{})}}),CanvaApiError);assert.equal(calls,3);
 calls=0;await assert.rejects(canvaRequest('test','/autofills',{}, {fetchImpl:async()=>{calls++;throw Error('Network failure')}}),/Network failure/);assert.equal(calls,1);
});
test('auth failures are distinct and Retry-After handles dates',async()=>{
 await assert.rejects(canvaRequest('test','/exports',undefined,{fetchImpl:async()=>response(401,{code:'invalid_access_token'})}),/Connect Canva again/);
 assert.equal(retryAfterSeconds('Wed, 11 Nov 2026 12:00:10 GMT',Date.parse('2026-11-11T12:00:00Z')),10);assert.equal(retryAfterSeconds('invalid'),0);
});
