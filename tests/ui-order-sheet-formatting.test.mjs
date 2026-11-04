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
    (full, tail, dependency) => dependency.includes('/types/') || dependency === './types' ? 'import type' + tail : full,
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
const sheetStub = 'data:text/javascript;base64,' + Buffer.from(`
  export const config = {google:{sheetId:'test-sheet'}};
  export function getGoogleAuth() { return {}; }
  export const google = {sheets() { return {spreadsheets:{
    async get() { return {data:{sheets:[{properties:{title:'Orders',sheetId:0}}]}}; },
    values:{
      async get() { return {data:{values:[['ORDER_ID']]}}; },
      async append(request) { globalThis.__createOrderFixture.append=request; return {data:{updates:{updatedRange:'Orders!A77:S77'}}}; }
    },
    async batchUpdate(request) { globalThis.__createOrderFixture.format=request; if(globalThis.__createOrderFixture.failFormatting) throw Error('test formatting failure'); return {}; }
  }}; }};
`).toString('base64');
const dates = await import(moduleUrl('lib/utils/date.ts'));
const { appendOrderToSheet } = await import(moduleUrl('lib/google/sheets.ts', {'googleapis':sheetStub,'./auth':sheetStub,'@/lib/config':sheetStub}));
const createInput = {customerName:'Test Customer',mobileNumber:'9890539497',productDetails:'Test Product',productCost:500,advancePaid:100,fulfillmentMethod:'Pickup',productCategory:'Resin Art'};

test('UI order creation writes literal date/time strings like old rows that the original cron accepts', async () => {
  globalThis.__createOrderFixture = {};
  const result = await appendOrderToSheet(createInput);
  const fixture = globalThis.__createOrderFixture;
  const row = fixture.append.requestBody.values[0];
  assert.match(row[4], /^\d{1,2}\/\d{1,2}\/\d{4}$/);
  assert.match(row[11], /^\d{1,2}:\d{2}:\d{2} (AM|PM)$/);
  assert.equal(result.balance, 400);
  assert.equal(fixture.append.valueInputOption, 'RAW');
  assert.equal(fixture.format, undefined);
  assert.ok(Number.isFinite(Date.parse(dates.toIsoTimestamp(row[4], row[11]))));
  const displayed = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Kolkata', year:'numeric', month:'numeric', day:'numeric'}).format(new Date());
  assert.equal(row[4], displayed);
  delete globalThis.__createOrderFixture;
});

