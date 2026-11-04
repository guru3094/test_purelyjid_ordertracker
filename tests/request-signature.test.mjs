import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../lib/security/request-signature.ts',import.meta.url),'utf8'));
const {validSignature}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('PJResin signature verifies authentic payloads and rejects tampering and malformed signatures',()=>{
 const value='{"order":"PJ100001"}',secret='test-only-key';
 const signature=createHmac('sha256',secret).update(value).digest('hex');
 assert.equal(validSignature(value,signature,secret),true);
 assert.equal(validSignature(value+' ',signature,secret),false);
 assert.equal(validSignature(value,signature,'wrong-key'),false);
 for(const malformed of ['', 'abc', 'z'.repeat(64)]) assert.equal(validSignature(value,malformed,secret),false);
});
