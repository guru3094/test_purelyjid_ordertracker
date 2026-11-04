import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const stateUrl=url('export const state={written:[],rows:[]};');const {state}=await import(stateUrl);
const google=url(`import {state} from '${stateUrl}';export const google={sheets:()=>({spreadsheets:{values:{append:async(req)=>state.written.push(req)}}})};`);
const stubs={'googleapis':google,'./auth':url('export const getGoogleAuth=()=>({});'),'@/lib/config':url("export const config={google:{sheetId:'existing-sheet'}};"),'./sheets':url(`import {state} from '${stateUrl}';export const readOrdersSheet=async()=>state.rows;`)};
const source=compile('../lib/google/importStoreOrder.ts').replace(/from ['"]([^'"]+)['"]/g,(_,dep)=>`from '${stubs[dep]||dep}'`);const importer=await import(url(source));
test('store orders map to existing nineteen-column Orders sheet with same reference and actual line prices',async()=>{
 const b={orderRef:'PJM100001',name:'Customer',phone:'9999999999',email:'c@example.com',fulfilment:'Delivery',address:'Pune address',notes:'Fragile',subtotal:150,createdAt:'2026-10-29T12:00:00Z',items:[{name:'Resin',quantity:2,unitPrice:75}]};
 importer.validateStoreImport(b);await importer.appendImportedStoreOrder(b);const req=state.written[0];assert.equal(req.spreadsheetId,'existing-sheet');assert.equal(req.range,'Orders!A:S');assert.equal(req.valueInputOption,'RAW');const row=req.requestBody.values[0];assert.equal(row.length,19);assert.equal(row[0],b.orderRef);assert.equal(row[6],'ORDER_RECEIVED');assert.equal(row[15],150);assert.equal(row[16],0);assert.equal(row[17],150);assert.equal(row[18],'Raw Materials');assert.equal(row[4],'10/29/2026');assert.match(row[14],/Resin × 2/);
 state.rows=[['ORDER_ID'],row];assert.equal(await importer.importedRowExists(b),true);await assert.rejects(importer.importedRowExists({...b,phone:'8888888888'}),/collision/);
 assert.throws(()=>importer.validateStoreImport({...b,orderRef:'PJ100001'}));
});
