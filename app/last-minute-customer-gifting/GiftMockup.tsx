"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ArtworkSettings, KeychainShape, KeychainFinish } from "./MockupScene";
const MockupScene=dynamic(()=>import("./MockupScene"),{ssr:false,loading:()=> <p>Loading 3D preview…</p>});
const initial:ArtworkSettings={url:null,scale:1,x:0,y:0,fit:"cover"};
export type GiftMockupHandle={ getFiles:()=>Promise<File[]> };
type Props={productId:string;name:string;detail:string;keychainShape:KeychainShape;keychainFinish:KeychainFinish;onKeychainShapeChange:(shape:KeychainShape)=>void;onKeychainFinishChange:(finish:KeychainFinish)=>void};

const GiftMockup=forwardRef<GiftMockupHandle,Props>(function GiftMockup({productId,name,detail,keychainShape,keychainFinish,onKeychainShapeChange,onKeychainFinishChange},ref){
  const [front,setFront]=useState<ArtworkSettings>(initial);
  const [back,setBack]=useState<ArtworkSettings>(initial);
  const [samePhoto,setSamePhoto]=useState(true);
  const [side,setSide]=useState<"front"|"back">("front");
  const [rotation,setRotation]=useState(0);
  const [error,setError]=useState("");
  const originals=useRef<{front:File|null;back:File|null}>({front:null,back:null});
  const urls=useRef<string[]>([]);
  const capture=useRef<null|(()=>Promise<File>)>(null);
  const drag=useRef<{x:number;angle:number}|null>(null);
  const doubleSided=productId==="metal-keychain";
  const active=side==="back"&&doubleSided&&!samePhoto?back:front;
  const update=(patch:Partial<ArtworkSettings>)=>{if(side==="back"&&doubleSided&&!samePhoto)setBack(value=>({...value,...patch}));else setFront(value=>({...value,...patch}));};
  useEffect(()=>()=>urls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
  useImperativeHandle(ref,()=>({getFiles:async()=>{
    const files:File[]=[];
    if(originals.current.front) files.push(new File([originals.current.front],`front-${originals.current.front.name}`,{type:originals.current.front.type}));
    if(doubleSided&&!samePhoto&&originals.current.back)files.push(new File([originals.current.back],`back-${originals.current.back.name}`,{type:originals.current.back.type}));
    if((front.url||(doubleSided&&!samePhoto&&back.url))&&capture.current)files.push(await capture.current());
    return files;
  }}),[doubleSided,samePhoto,front,back]);
  return <section className="gift-mockup" aria-labelledby="mockup-title">
    <div className="gift-mockup-heading"><div><p className="vinyl-eyebrow">PREVIEW YOUR PERSONALISATION</p><h3 id="mockup-title">Your photo. Your gift.</h3></div><span>360° product preview</span></div>
    <p className="gift-mockup-copy">Drag to rotate the object. Resize and position your photo within the print area.</p>
    {doubleSided&&<div className="gift-form-row"><label>Keychain shape<select value={keychainShape} onChange={event=>onKeychainShapeChange(event.target.value as KeychainShape)}><option value="circle">Circle</option><option value="rectangle">Rectangle</option><option value="diamond">Rounded diamond</option><option value="hexagon">Hexagon</option><option value="heart">Heart</option><option value="oval">Oval</option></select></label><label>Metal finish<select value={keychainFinish} onChange={event=>onKeychainFinishChange(event.target.value as KeychainFinish)}><option value="silver">Silver</option><option value="gold">Gold</option></select></label></div>}
    {doubleSided&&<><label className="gift-same-photo"><input type="checkbox" checked={samePhoto} onChange={event=>{setSamePhoto(event.target.checked);setSide("front");}} />Use the same photo and placement on both sides</label><div className="gift-mockup-actions"><button type="button" aria-pressed={side==="front"} onClick={()=>{setSide("front");setRotation(0);}}>Front photo</button><button type="button" aria-pressed={side==="back"} onClick={()=>{setSide("back");setRotation(180);}}>Back photo</button></div></>}
    <label className="gift-upload">{doubleSided?`${samePhoto?"Both sides":side==="front"?"Front":"Back"}: upload photo / logo`:"Upload photo / logo"}<input key={side+String(samePhoto)} type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{
      const file=event.target.files?.[0];if(!file)return;
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>10*1024*1024){setError("Choose a PNG, JPG or WebP image up to 10 MB.");return;}
      const url=URL.createObjectURL(file),image=new Image();
      image.onload=()=>{urls.current.push(url);const target=side==="back"&&doubleSided&&!samePhoto?"back":"front";originals.current[target]=file;update({url,scale:1,x:0,y:0});setError("");};
      image.onerror=()=>{URL.revokeObjectURL(url);setError("This image could not be opened.");};image.src=url;
    }}/></label>
    {error&&<p role="alert" className="gift-validation">{error}</p>}
    <div className="gift-mockup-stage gift-realistic-stage" onPointerDown={event=>{drag.current={x:event.clientX,angle:rotation};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(drag.current)setRotation(((drag.current.angle+(event.clientX-drag.current.x)*.7)%360+360)%360);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <MockupScene productId={productId} rotation={rotation} front={front} back={back} samePhoto={samePhoto} captureRef={capture} keychainShape={keychainShape} keychainFinish={keychainFinish} />
    </div>
    <p className="gift-mockup-caption">{name} · {detail}</p>
    <label className="gift-mockup-control">Rotate product <span>{Math.round(rotation)}°</span><input type="range" min="0" max="360" value={rotation} onChange={event=>setRotation(Number(event.target.value))}/></label>
    <div className="gift-mockup-actions"><button type="button" aria-pressed={active.fit!=="contain"} onClick={()=>update({fit:"cover",scale:1,x:0,y:0})}>Fill print area</button><button type="button" aria-pressed={active.fit==="contain"} onClick={()=>update({fit:"contain",scale:1,x:0,y:0})}>Fit entire photo</button></div>
    <label className="gift-mockup-control">Image size <span>{active.scale.toFixed(1)}×</span><input type="range" min="0.1" max="4" step="0.05" value={active.scale} onChange={event=>update({scale:Number(event.target.value)})}/></label>
    <label className="gift-mockup-control">Move left / right <span>{active.x}%</span><input type="range" min="-80" max="80" value={active.x} onChange={event=>update({x:Number(event.target.value)})}/></label>
    <label className="gift-mockup-control">Move down / up <span>{active.y}%</span><input type="range" min="-80" max="80" value={active.y} onChange={event=>update({y:Number(event.target.value)})}/></label>
    <div className="gift-mockup-actions"><button type="button" onClick={()=>{setRotation(0);update({scale:1,x:0,y:0});}}>Reset placement</button>{active.url&&<button type="button" onClick={()=>{originals.current[side==="back"&&doubleSided&&!samePhoto?"back":"front"]=null;update({url:null});}}>Remove photo</button>}</div>
    <p className="gift-mockup-footnote">Your original photo and a four-view mockup can be shared with your enquiry. Preview shapes are based on the reference products.</p>
  </section>;
});
export default GiftMockup;
