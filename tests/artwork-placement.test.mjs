import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../app/last-minute-customer-gifting/artworkPlacement.ts',import.meta.url),'utf8'));
const {artworkPlacement}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('portrait photo rotated to landscape fits the wrap without stretching',()=>{
  const p=artworkPlacement(400,800,1000,500,90,'contain',1,0,0);
  assert.equal(p.height,1000);assert.equal(p.width,500);assert.equal(p.height/p.width,2);assert.equal(p.radians,Math.PI/2);
});
test('cover fills the whole wrap and contain preserves the whole photo',()=>{
  const cover=artworkPlacement(400,800,1000,500,0,'cover',1,0,0);
  const contain=artworkPlacement(400,800,1000,500,0,'contain',1,0,0);
  assert.equal(cover.width,1000);assert.equal(cover.height,2000);
  assert.equal(contain.width,250);assert.equal(contain.height,500);
});
test('image placement and scale survive an upside-down landscape rotation',()=>{
  const p=artworkPlacement(400,800,1000,500,270,'contain',.5,10,-20);
  assert.equal(p.width,250);assert.equal(p.height,500);assert.equal(p.centreX,600);assert.equal(p.centreY,350);assert.equal(p.radians,Math.PI*1.5);
});
