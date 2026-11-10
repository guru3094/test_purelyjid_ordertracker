"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type ArtworkSettings = { url: string | null; scale: number; x: number; y: number };
type Props = { productId: string; rotation: number; front: ArtworkSettings; back: ArtworkSettings; samePhoto: boolean; captureRef: MutableRefObject<null | (() => Promise<File>)> };

function artworkTexture(settings: ArtworkSettings, cylindrical: boolean, onReady: () => void) {
  const canvas = document.createElement("canvas"); canvas.width = cylindrical ? 2048 : 1024; canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (settings.url) {
    const image = new Image();
    image.onload = () => {
      if(texture.userData.cancelled)return;
      // Fit without distortion, then resize and move inside the actual print area.
      const fit = Math.min(canvas.width * (cylindrical ? .78 : .9) / image.width, canvas.height * .9 / image.height);
      const w = image.width * fit * settings.scale, h = image.height * fit * settings.scale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, (canvas.width-w)/2 + settings.x*canvas.width/100, (canvas.height-h)/2-settings.y*canvas.height/100, w, h);
      texture.needsUpdate = true; onReady();
    };
    image.src = settings.url;
  }
  return texture;
}

export default function MockupScene({ productId, rotation, front, back, samePhoto, captureRef }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const object = useRef<THREE.Group | null>(null);
  const printMaterial=useRef<THREE.MeshStandardMaterial|null>(null);
  const rearMaterial=useRef<THREE.MeshStandardMaterial|null>(null);
  const angle = useRef(rotation);
  angle.current = rotation;
  useEffect(() => { if(object.current) object.current.rotation.y = rotation*Math.PI/180; }, [rotation]);

  useEffect(() => {
    const host = mount.current; if(!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); }
    catch { host.textContent="3D preview needs WebGL. Please enable hardware acceleration or try another browser.";return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.35;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();scene.background=new THREE.Color("#e6e3df");
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
    const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,2.6,7.4);camera.lookAt(0,1.35,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x8b8177,2.5));
    const key = new THREE.DirectionalLight(0xffffff,4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;scene.add(key);
    const fill = new THREE.DirectionalLight(0xe7f0ff,2);fill.position.set(3,3,-2);scene.add(fill);
    const group=new THREE.Group();object.current=group;group.rotation.y=angle.current*Math.PI/180;scene.add(group);
    const white=new THREE.MeshStandardMaterial({color:0xfafafa,roughness:.2,metalness:.05});
    const metal=new THREE.MeshStandardMaterial({color:0xcdd1d3,roughness:.23,metalness:.8});
    const black=new THREE.MeshStandardMaterial({color:0x17191b,roughness:.32});
    const wood=new THREE.MeshStandardMaterial({color:0xb78a53,roughness:.75});
    const add=(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0,parent:THREE.Group|THREE.Scene=group) => {const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
    const cylinder=["white-mug","magic-mug","sipper-small","sipper-large","sports-bottle","tumbler"].includes(productId);
    const mug=productId.includes("mug"), bottle=productId.includes("sipper")||productId==="sports-bottle";
    const resources:THREE.Texture[]=[];
    const render=()=>renderer.render(scene,camera);
    const frontTexture=artworkTexture(front,cylinder,render);resources.push(frontTexture);
    const backTexture=artworkTexture(samePhoto?front:back,false,render);resources.push(backTexture);
    const printed=new THREE.MeshStandardMaterial({map:frontTexture,transparent:true,roughness:.3,depthWrite:false,side:THREE.FrontSide});
    printMaterial.current=printed;
    const rearPrinted=new THREE.MeshStandardMaterial({map:backTexture,transparent:true,roughness:.3});rearMaterial.current=rearPrinted;
    if(cylinder){
      const r=mug?.73:.49,h=mug?1.65:bottle?2.3:2.25,base=.42;
      if(mug){
        const profile=[[0,0],[r-.05,0],[r,.04],[r,h-.04],[r-.015,h],[r-.07,h],[r-.085,h-.06],[r-.085,.13],[0,.13]].map(([x,y])=>new THREE.Vector2(x,y));
        add(new THREE.LatheGeometry(profile,128),productId==="magic-mug"?black:white,0,base,0);
        // A rounded ceramic handle, attached at both ends, with an open centre.
        const handle=add(new THREE.TorusGeometry(.49,.095,20,96),white,r+.13,base+h*.5,0);handle.scale.set(.8,1.18,1);
        add(new THREE.CylinderGeometry(.13,.13,.28,24),white,r,base+h*.82,0).rotation.z=Math.PI/2;
        add(new THREE.CylinderGeometry(.13,.13,.28,24),white,r,base+h*.18,0).rotation.z=Math.PI/2;
      } else if(bottle){
        const profile=[[0,0],[r*.92,0],[r,.06],[r,h-.28],[r*.97,h-.18],[r*.78,h+.03],[r*.53,h+.15],[r*.52,h+.37],[0,h+.37]].map(([x,y])=>new THREE.Vector2(x,y));
        add(new THREE.LatheGeometry(profile,128),metal,0,base,0);
        add(new THREE.CylinderGeometry(.29,.29,.19,64),black,0,base+h+.4,0);
        const loop=add(new THREE.TorusGeometry(.15,.065,16,48),black,0,base+h+.63,0);loop.scale.y=1.2;
        const clip=add(new THREE.TorusGeometry(.2,.024,12,48),metal,.3,base+h+.43,.02);clip.scale.set(.58,1.65,1);clip.rotation.z=-.35;
      } else {
        const profile=[[0,0],[r*.94,0],[r,.05],[r,h],[r-.05,h],[r-.06,.12],[0,.12]].map(([x,y])=>new THREE.Vector2(x,y));
        add(new THREE.LatheGeometry(profile,128),white,0,base,0);
        add(new THREE.CylinderGeometry(r+.025,r+.025,.075,96),black,0,base+h+.03,0);
      }
      const printHeight=mug?h-.17:bottle?h-.32:h-.18;
      // Leave a blank seam near the mug handle, as on a sublimation wrap.
      const arc=mug?Math.PI*1.7:Math.PI*1.95;
      const thetaStart=-arc/2;
      const surface=add(new THREE.CylinderGeometry(r+.002,r+.002,printHeight,128,1,true,thetaStart,arc),printed,0,base+printHeight/2+.08,0);
      surface.rotation.y=0;
    } else {
      const keychain=productId.includes("keychain");
      const r=.78; let width=1.7,height=1.7;
      if(productId==="photo-4"){width=1.25;height=1.9;}if(productId==="photo-10"){width=1.5;height=1.9;}if(productId==="photo-24"){width=1.05;height=2.1;}if(productId==="pvc-cards"){width=1.4;height=2.1;}
      const y=1.55;
      if(keychain){
        const body=add(new THREE.CylinderGeometry(r,r,.09,96),productId==="wooden-keychain"?wood:metal,0,y,0);body.rotation.x=Math.PI/2;
        const face=add(new THREE.CircleGeometry(r-.07,96),printed,0,y,.047);face.rotation.y=0;
        if(productId==="metal-keychain") {const rear=add(new THREE.CircleGeometry(r-.07,96),rearPrinted,0,y,-.047);rear.rotation.y=Math.PI;}
        add(new THREE.TorusGeometry(.12,.025,12,48),metal,0,y+r+.08,0);
        add(new THREE.TorusGeometry(.27,.025,12,64),metal,0,y+r+.4,0);
      } else {
        add(new THREE.BoxGeometry(width,height,.075),productId==="led-frame"?white:metal,0,y,0);
        const face=add(new THREE.PlaneGeometry(width-.055,height-.055),printed,0,y,.04);
        face.scale.x=1;
        if(productId==="led-frame") add(new THREE.BoxGeometry(width+.12,.1,.3),white,0,y-height/2-.06,0);
      }
    }
    const pedestal=add(new THREE.CylinderGeometry(1.65,1.7,.2,128),new THREE.MeshStandardMaterial({color:0xf4f2ef,roughness:.65}),0,.22,0,scene);pedestal.receiveShadow=true;
    const floor=add(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xe6e3df,roughness:1}),0,.1,0,scene);floor.rotation.x=-Math.PI/2;
    const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();};
    captureRef.current=async()=>{
      const collage=document.createElement("canvas");collage.width=1600;collage.height=1600;
      const ctx=collage.getContext("2d")!;ctx.fillStyle="#f6f2eb";ctx.fillRect(0,0,1600,1600);
      const saved=group.rotation.y;
      [0,90,180,270].forEach((degrees,index)=>{
        group.rotation.y=degrees*Math.PI/180;render();
        const x=(index%2)*800,y=Math.floor(index/2)*800;
        const fit=Math.min(800/renderer.domElement.width,750/renderer.domElement.height);
        const width=renderer.domElement.width*fit,height=renderer.domElement.height*fit;
        ctx.drawImage(renderer.domElement,x+(800-width)/2,y+(750-height)/2,width,height);ctx.fillStyle="#38291e";ctx.font="24px Arial";ctx.textAlign="center";ctx.fillText(["Front","Right","Back","Left"][index],x+400,y+785);
      });group.rotation.y=saved;render();
      const blob=await new Promise<Blob>((resolve,reject)=>collage.toBlob(value=>value?resolve(value):reject(new Error("Mockup export failed")),"image/png"));
      return new File([blob],`${productId}-four-view-mockup.png`,{type:"image/png"});
    };
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    let frame=0;const animate=()=>{frame=requestAnimationFrame(animate);group.rotation.y=angle.current*Math.PI/180;render();};animate();
    return()=>{captureRef.current=null;cancelAnimationFrame(frame);observer.disconnect();object.current=null;scene.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose();}});resources.forEach(t=>{t.userData.cancelled=true;t.dispose();});environment.dispose();renderer.dispose();renderer.domElement.remove();};
  },[productId,captureRef]);
  useEffect(()=>{
    const cylinder=["white-mug","magic-mug","sipper-small","sipper-large","sports-bottle","tumbler"].includes(productId);
    const frontTexture=artworkTexture(front,cylinder,()=>{}),backTexture=artworkTexture(samePhoto?front:back,false,()=>{});
    if(printMaterial.current){printMaterial.current.map=frontTexture;printMaterial.current.needsUpdate=true;}
    if(rearMaterial.current){rearMaterial.current.map=backTexture;rearMaterial.current.needsUpdate=true;}
    return()=>{for(const texture of [frontTexture,backTexture]){texture.userData.cancelled=true;texture.dispose();}};
  },[productId,front,back,samePhoto]);
  return <div className="gift-webgl" ref={mount} role="img" aria-label="Interactive 3D product with your selected artwork" />;
}
