import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const urls = new Map();
function moduleUrl(relative, overrides = {}) {
  const cacheKey = relative + JSON.stringify(overrides);
  if (urls.has(cacheKey)) return urls.get(cacheKey);
  // Match TypeScript's elision of imports from the project's type-only modules.
  const raw = fs.readFileSync(path.join(root, relative), 'utf8').replace(
    /^import(\s+[\s\S]*?\s+from\s+["']([^"']+)["'];)/gm,
    (full, tail, dependency) => dependency.includes('/types/') || dependency === './types' || dependency.endsWith('/queueTypes') || dependency === './queueTypes' || dependency.endsWith('/models/OrderSearchRequest') || tail.trim().startsWith('{ DbOrder }') ? 'import type' + tail : full,
  );
  let source = stripTypeScriptTypes(raw);
  source = source.replace(/(from\s+["'])([^"']+)(["'])/g, (_, prefix, dependency, suffix) => {
    let target = overrides[dependency];
    if (!target && dependency.startsWith('@/')) target = moduleUrl(dependency.slice(2) + '.ts', overrides);
    if (!target && dependency.startsWith('.')) target = moduleUrl(path.join(path.dirname(relative), dependency) + '.ts', overrides);
    return prefix + (target || dependency) + suffix;
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  urls.set(cacheKey, url);
  return url;
}
const reference = JSON.parse(fs.readFileSync(path.join(root, 'tests/status-reference.json'), 'utf8'));
const { ORDER_STATUSES } = await import(moduleUrl('lib/constants/orderStatuses.ts'));
const { validateStatus } = await import(moduleUrl('lib/validation/statusValidator.ts'));

test('all 27 captured dropdown choices exactly match the validator and active database statuses', () => {
  const sorted = values => [...values].sort();
  assert.equal(reference.dropdown.length, 27);
  assert.equal(new Set(reference.dropdown).size, 27);
  assert.deepEqual(sorted(reference.dropdown), sorted(ORDER_STATUSES));
  assert.deepEqual(sorted(reference.statuses.filter(s => s.is_active).map(s => s.status_code)), sorted(ORDER_STATUSES));
  for (const code of reference.dropdown) assert.doesNotThrow(() => validateStatus(code));
  assert.throws(() => validateStatus('DEHYDRATION_IN_PROGRESS'), /Invalid order status/);
  assert.throws(() => validateStatus('NOT_A_STATUS'), /Invalid order status/);
});

const clientStub = 'data:text/javascript;base64,' + Buffer.from(`
  export const supabase = {from(table) {
    const filters = []; let action = 'select'; let payload;
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      insert(value) { action='insert'; payload=value; return query; },
      update(value) { action='update'; payload=value; return query; },
      async single() { return finish(); },
      async maybeSingle() { return finish(); }
    };
    function finish() {
      const fixture=globalThis.__statusSyncFixture;
      if(action==='insert' || action==='update') {
        if(table!=='orders') throw Error('Unexpected write table');
        if(!fixture.reference.statuses.some(s=>s.id===payload.status_id && s.is_active)) throw Error('Status UUID missing');
        if(payload.fulfillment_method==='Delivery' && !fixture.reference.couriers.some(c=>c.id===payload.courier_id)) throw Error('Courier UUID missing');
        fixture.writes.push({action,payload,filters});
        return {data:payload,error:null};
      }
      const rows = table==='order_status_master' ? fixture.reference.statuses : table==='courier_master' ? fixture.reference.couriers : fixture.existing;
      const data=rows.find(row=>filters.every(([key,value])=>row[key]===value)) ?? null;
      return {data,error:null};
    }
    return query;
  }};
`).toString('base64');
const serviceStub = 'data:text/javascript;base64,' + Buffer.from(`
  export async function readOrdersSheet() { return globalThis.__statusSyncFixture.rows; }
  export const logger={info(){},error(...args){globalThis.__statusSyncFixture.errors.push(args);}};
  export async function createSyncExecution(){return{id:'status-test'};}
  export async function updateSyncExecution(id,value){globalThis.__statusSyncFixture.executions.push(value);}
  export async function updateSyncCheckpoint(){}
`).toString('base64');
const overrides = {
  '@/lib/google/sheets':serviceStub,
  '@/lib/logger/logger':serviceStub,
  '@/lib/supabase/syncExecutionRepository':serviceStub,
  '@/lib/supabase/syncCheckpointRepository':serviceStub,
  './client':clientStub,
};
const fixtures=reference.statuses.flatMap(status => (status.fulfillment_method==='Both' ? ['Pickup','Delivery'] : [status.fulfillment_method]).map(method => ({status:status.status_code,statusId:status.id,method})));
for (const syncFile of ['lib/services/googleSheetSyncService.ts','lib/sync/syncGoogleSheet.ts']) {
  test(syncFile + ': all 27 statuses pass the actual validator, queue, repositories and mapping for inserts and updates', async () => {
    const rows=fixtures.map((fixture,index)=>[
      'STATUS_TEST_'+String(index+1).padStart(3,'0'),'Status Verification','0000000000','','10/11/2026',fixture.method,fixture.status,
      fixture.method==='Delivery' ? 'DTDC' : '','','','','11:40:34 PM','','','Test Product','500','100','400','Resin Art'
    ]);
    const {syncGoogleSheet}=await import(moduleUrl(syncFile,overrides));
    for (const action of ['insert','update']) {
      const fixture={reference,rows:[['ORDER_ID'],...rows],existing:action==='update' ? rows.map(row=>({order_id:row[0]})) : [],writes:[],errors:[],executions:[]};
      globalThis.__statusSyncFixture=fixture;
      const result=await syncGoogleSheet();
      assert.equal(result.failed,0);
      assert.equal(fixture.errors.length,0);
      assert.equal(fixture.writes.length,fixtures.length);
      assert.equal(new Set(fixture.writes.map(w=>w.payload.status_id)).size,27);
      fixture.writes.forEach((write,index)=>{
        assert.equal(write.action,action);
        assert.equal(write.payload.status_id,fixtures[index].statusId);
        assert.equal(write.payload.fulfillment_method,fixtures[index].method);
        assert.equal(write.payload.balance_to_be_paid,400);
        assert.equal(write.payload.courier_id,fixtures[index].method==='Delivery' ? reference.couriers.find(c=>c.courier_name==='DTDC').id : null);
      });
      assert.equal(fixture.executions.at(-1).status,'SUCCESS');
      if(syncFile==='lib/sync/syncGoogleSheet.ts') assert.equal(result[action==='insert'?'inserted':'updated'],fixtures.length);
      delete globalThis.__statusSyncFixture;
    }
  });
}
