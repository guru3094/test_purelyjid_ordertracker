"use client";

import { useEffect, useRef, useState } from "react";

type Props = { productId: string; name: string; detail: string };

export default function GiftMockup({ productId, name, detail }: Props) {
  const [artwork, setArtwork] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (artwork) URL.revokeObjectURL(artwork); }, [artwork]);
  const cylindrical = ["white-mug", "magic-mug", "sipper-small", "sipper-large", "sports-bottle", "tumbler"].includes(productId);
  const mug = productId.includes("mug");
  const bottle = productId.includes("sipper") || productId === "sports-bottle";
  const radius = mug ? 76 : 57;
  const height = mug ? 160 : bottle ? 235 : 210;
  const circumference = 2 * Math.PI * radius;
  const panels = 64;
  const dark = productId === "magic-mug";
  const back = !cylindrical && Math.cos(rotation * Math.PI / 180) < 0;
  const doubleSided = productId === "metal-keychain";

  return <section className="gift-mockup" aria-labelledby="mockup-title">
    <div className="gift-mockup-heading"><div><p className="vinyl-eyebrow">PREVIEW YOUR PERSONALISATION</p><h3 id="mockup-title">Your photo. Your gift.</h3></div><span>{cylindrical ? "360° mockup" : "Front / back preview"}</span></div>
    <p className="gift-mockup-copy">Upload a photo or logo, then drag the product or use the rotation slider to explore your design.</p>
    <label className="gift-upload">Upload photo / logo<input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
      const file = event.target.files?.[0]; if (!file) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {setError("Choose a PNG, JPG or WebP image up to 10 MB."); return;}
      const url = URL.createObjectURL(file); const image = new Image();
      image.onload = () => {setAspect(image.naturalWidth / image.naturalHeight);setArtwork(url);setError("");setZoom(1);};
      image.onerror = () => {URL.revokeObjectURL(url);setError("This image could not be opened. Please choose another image.");};
      image.src = url;
    }} /></label>
    {error && <p role="alert" className="gift-validation">{error}</p>}
    <div className="gift-mockup-stage" style={{cursor:"grab"}} onPointerDown={event => {drag.current={x:event.clientX,angle:rotation};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event => {if(drag.current) setRotation(((drag.current.angle+(event.clientX-drag.current.x)*1.2)%360+360)%360);}} onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}>
      <div className="gift-mockup-shadow" />
      {cylindrical ? <div className="gift-cylinder" aria-label={`${name} artwork mockup, rotated ${Math.round(rotation)} degrees`} style={{height,width:radius*2,transform:`rotateX(-8deg) rotateY(${rotation}deg)`}}>
        {Array.from({length:panels},(_,index) => <div key={index} className="gift-cylinder-panel" style={{width:2*radius*Math.tan(Math.PI/panels)+.7,height,backgroundColor:dark ? "#282523" : "#faf8f2",transform:`translateX(-50%) rotateY(${index*360/panels}deg) translateZ(${radius}px)`,backgroundImage:artwork ? `linear-gradient(90deg,rgba(0,0,0,.05),transparent),url("${artwork}")` : "linear-gradient(0deg,#dfc7a4,#fffaf0)",backgroundSize:artwork ? `auto, ${circumference*zoom}px ${circumference*zoom/aspect}px` : undefined,backgroundPosition:artwork ? `center, ${-index*circumference/panels}px center` : undefined,backgroundRepeat:"no-repeat"}} />)}
        <div className="gift-cylinder-top" style={{width:radius*2,height:radius*2,transform:`translateY(-${radius}px) rotateX(90deg)`,background:mug ? "radial-gradient(ellipse,#928679 0%,#e4ddd1 65%,#fffdf5 68%)" : "#d5cabb"}} />
        {mug && <div className="gift-mug-handle" style={{transform:`translateX(${radius*1.55}px) translateY(35px)`}} />}
        {bottle && <div className="gift-bottle-cap" style={{transform:`translateX(${radius-27}px) translateY(-33px)`}} />}
        {!artwork && <span className="gift-mockup-placeholder" style={{transform:`translateZ(${radius+2}px)`}}>YOUR<br />PHOTO</span>}
      </div> : <div className="gift-flat-product" style={{transform:`rotateY(${rotation}deg)`,borderRadius:productId.includes("keychain") ? "50%" : "3px",aspectRatio:productId === "photo-24" ? "1 / 2" : productId === "photo-4" ? "2 / 3" : productId === "photo-10" ? "4 / 5" : "1"}}>
        <div className="gift-flat-face" style={{backgroundImage:artwork ? `url("${artwork}")` : undefined,backgroundSize:`${zoom*100}% auto`}}>{!artwork && "YOUR PHOTO"}</div>
        <div className="gift-flat-face gift-flat-back" style={{backgroundImage:doubleSided && artwork ? `url("${artwork}")` : undefined,backgroundSize:`${zoom*100}% auto`}}>{!(doubleSided && artwork) && "BACK"}</div>
      </div>}
    </div>
    <p className="gift-mockup-caption">{name} · {detail}{!cylindrical && ` · ${back ? "Back" : "Front"}`}</p>
    <label className="gift-mockup-control">Rotation <span>{Math.round(rotation)}°</span><input type="range" min="0" max="360" value={rotation} onChange={event => setRotation(Number(event.target.value))} /></label>
    <label className="gift-mockup-control">Artwork zoom <span>{zoom.toFixed(1)}×</span><input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
    <div className="gift-mockup-actions"><button type="button" onClick={() => {setRotation(0);setZoom(1);}}>Reset view</button>{artwork && <button type="button" onClick={() => {setArtwork(null);if(input.current) input.current.value="";}}>Remove photo</button>}</div>
    <p className="gift-mockup-footnote">Illustrative preview; product shape and print placement may vary. Your photo stays in this browser. Share the original artwork in WhatsApp with your enquiry.</p>
  </section>;
}
