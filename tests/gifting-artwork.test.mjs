import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
const code=ts.transpileModule(readFileSync(new URL('../lib/gifting/artwork.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};
vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='@/lib/vinyl/artwork'?{artworkStorage:()=>{throw new Error('Unexpected storage call');}}:require(name),process:{env:{STAFF_SESSION_SECRET:'test-only-gifting-signature-secret-123456'}},Buffer,Date});
const {giftToken,validGiftLink,LINK_LIFETIME_SECONDS}=module.exports;
const id='12345678-1234-4234-8234-123456789abc.png',now=100000,expires=now+LINK_LIFETIME_SECONDS;
test('signed image link authorizes only its exact file and expiry',()=>{
 const token=giftToken(id,expires);assert(validGiftLink(id,expires,token,now));
 assert.equal(validGiftLink(id.replace('.png','.jpg'),expires,token,now),false);
 assert.equal(validGiftLink(id,expires-1,token,now),false);
 assert.equal(validGiftLink(id,expires,'a'.repeat(64),now),false);
});
test('expired, malformed and path traversal links are rejected',()=>{
 assert.equal(validGiftLink(id,expires,giftToken(id,expires),expires),false);
 assert.equal(validGiftLink('../'+id,expires,giftToken('../'+id,expires),now),false);
 assert.equal(validGiftLink(id,NaN,'a'.repeat(64),now),false);
 assert.equal(validGiftLink(id,expires,'short',now),false);
});
