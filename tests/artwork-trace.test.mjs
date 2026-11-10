import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
let source = stripTypeScriptTypes(readFileSync(new URL('../app/cricut_svg/artwork-trace.ts', import.meta.url), 'utf8'));
source = source.replace('"svg-path-bbox"', JSON.stringify(import.meta.resolve('svg-path-bbox')));
source = source.replace('"svgpath"', JSON.stringify(import.meta.resolve('svgpath')));
const { traceArtwork } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
async function trace(width, height, filled, minArea = 8) {
  const data = new Uint8ClampedArray(width*height*4);
  for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const i=(y*width+x)*4;
    data[i]=data[i+1]=data[i+2]=filled(x,y)?0:255; data[i+3]=255;
  }
  globalThis.createImageBitmap = async () => ({width,height,close(){}});
  globalThis.document = {createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data})})})};
  try { return await traceArtwork(new Blob(),180,false,minArea); }
  finally { delete globalThis.createImageBitmap; delete globalThis.document; }
}
test('diagonal straight edges are simplified without rounding sharp corners',async()=>{
  const r=await trace(160,160,(x,y)=>x>=20&&y>=20&&x+y<150);
  assert.equal(r.pathCount,1);
  assert.ok((r.path.match(/L/g)||[]).length<=5,r.path);
  assert.deepEqual(r.bounds,{x1:20,y1:20,x2:130,y2:130});
  assert.doesNotMatch(r.path,/[CQ]/);
});
test('tiny holes and islands are removed, intentional large holes remain',async()=>{
  const r=await trace(100,100,(x,y)=>
    (x>=10&&x<90&&y>=10&&y<90&&!(x>=35&&x<65&&y>=35&&y<65)&&!(x===20&&y===20))|| (x===2&&y===2));
  assert.equal(r.pathCount,2);
  assert.equal(r.fillRule,'evenodd');
  assert.deepEqual(r.bounds,{x1:10,y1:10,x2:90,y2:90});
});
test('zero tiny-shape removal keeps small intentional holes',async()=>{
  const r=await trace(40,40,(x,y)=>x>=5&&x<35&&y>=5&&y<35&&!(x===20&&y===20),0);
  assert.equal(r.pathCount,2);
});
test('curved silhouettes use smooth vector segments',async()=>{
  const r=await trace(120,120,(x,y)=>(x-60)**2+(y-60)**2<45**2);
  assert.equal(r.pathCount,1);
  assert.ok((r.path.match(/[CQ]/g)||[]).length>12, r.path);
  assert.ok(Object.values(r.bounds).every(Number.isFinite));
});
