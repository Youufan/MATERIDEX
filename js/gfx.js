'use strict';
/* ════════════════════════════════════════════════════════════
   MATERIDEX · SHARED RENDERING SYSTEM
   env lighting · bloom composer · material library · particles
   ════════════════════════════════════════════════════════════ */
const HAS3D = typeof THREE!=='undefined' && (()=>{ try{const c=document.createElement('canvas');
  return !!(c.getContext('webgl')||c.getContext('experimental-webgl'));}catch(e){return false;} })();

const GFX={
  _env:null,

  /* -------- procedural studio environment (equirect canvas → PMREM) -------- */
  envMap(renderer){
    if(this._env) return this._env;
    const cv=document.createElement('canvas'); cv.width=1024; cv.height=512;
    const x=cv.getContext('2d');
    // base: deep ink with violet horizon band
    const base=x.createLinearGradient(0,0,0,512);
    base.addColorStop(0,'#06060f'); base.addColorStop(.42,'#0b0a1c');
    base.addColorStop(.55,'#241c4a'); base.addColorStop(.62,'#0d0c20'); base.addColorStop(1,'#020208');
    x.fillStyle=base; x.fillRect(0,0,1024,512);
    // key light — huge soft pearl above
    const blob=(cx,cy,r,c0,c1)=>{ const g=x.createRadialGradient(cx,cy,2,cx,cy,r);
      g.addColorStop(0,c0); g.addColorStop(1,c1); x.fillStyle=g;
      x.fillRect(cx-r,cy-r,r*2,r*2); };
    blob(300,60,300,'rgba(255,252,240,.95)','rgba(255,252,240,0)');
    blob(800,120,240,'rgba(143,216,242,.5)','rgba(143,216,242,0)');
    blob(560,300,300,'rgba(139,108,240,.55)','rgba(139,108,240,0)');
    blob(80,420,260,'rgba(255,138,92,.16)','rgba(255,138,92,0)');
    blob(980,440,220,'rgba(205,188,247,.2)','rgba(205,188,247,0)');
    // thin diffraction strips near horizon
    for(let i=0;i<14;i++){ const y=250+i*4;
      x.fillStyle=`hsla(${250+i*9},80%,70%,${.05})`; x.fillRect(0,y,1024,1.6); }
    const tex=new THREE.CanvasTexture(cv);
    tex.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);
    this._env=pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
    return this._env;
  },

  /* -------- renderer + optional bloom composer -------- */
  stage(canvas,{bloom=1.0,fov=42}={}){
    const renderer=new THREE.WebGLRenderer({canvas,antialias:S.settings.fx!=='low',alpha:true,
      powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, S.settings.fx==='low'?1:2));
    renderer.outputEncoding=THREE.sRGBEncoding;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.05;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(fov,1,.1,300);
    scene.environment=this.envMap(renderer);
    let composer=null,bloomPass=null;
    const useBloom = bloom>0 && S.settings.fx!=='low' && typeof THREE.EffectComposer!=='undefined';
    if(useBloom){
      composer=new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene,camera));
      bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(1,1), bloom, .55, .82);
      composer.addPass(bloomPass);
    }
    const st={renderer,scene,camera,composer,bloomPass,w:0,h:0,
      setSize(w,h){ if(w===this.w&&h===this.h||!w||!h) return; this.w=w; this.h=h;
        renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
        if(composer){ composer.setSize(w,h); } },
      render(){ if(composer) composer.render(); else renderer.render(scene,camera); } };
    return st;
  },

  /* -------- material library -------- */
  chrome(hex='#e8e6f0',rough=.12){ return new THREE.MeshPhysicalMaterial({
    color:new THREE.Color(hex), metalness:1, roughness:rough,
    envMapIntensity:2.2, clearcoat:1, clearcoatRoughness:.08 }); },
  glass(hex='#cdbcf7',opacity=.26){ return new THREE.MeshPhysicalMaterial({
    color:new THREE.Color(hex), metalness:0, roughness:.06, transmission:.92,
    transparent:true, opacity, envMapIntensity:1.4, clearcoat:1, clearcoatRoughness:.04,
    side:THREE.DoubleSide, depthWrite:false }); },
  crystal(hex){ const c=new THREE.Color(hex); return new THREE.MeshPhysicalMaterial({
    color:c, metalness:.05, roughness:.02, transmission:.7, ior:2.2, thickness:1.5,
    transparent:true, opacity:.92, envMapIntensity:2, emissive:c.clone().multiplyScalar(.22),
    clearcoat:1, clearcoatRoughness:.03, flatShading:true }); },
  /* iridescent — fresnel hue-shift injected into physical material */
  iridescent(hex='#cdbcf7',strength=.7){
    const m=new THREE.MeshPhysicalMaterial({ color:new THREE.Color(hex), metalness:.85, roughness:.16,
      envMapIntensity:1.8, clearcoat:1, clearcoatRoughness:.1, transparent:true, opacity:.98 });
    m.onBeforeCompile=(sh)=>{ sh.uniforms.uIriS={value:strength};
      sh.fragmentShader=sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform float uIriS;\nvec3 iriShift(float ct){float h=6.2831*(ct*2.2+0.15);return 0.5+0.5*vec3(cos(h),cos(h-2.094),cos(h+2.094));}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n{ float ct=abs(dot(normalize(vViewPosition),normal));\n  vec3 film=iriShift(ct);\n  totalEmissiveRadiance += film * pow(1.0-ct,2.0) * uIriS * 0.55; }`);
    };
    return m; },

  /* -------- soft round sprite texture -------- */
  _sprites:{},
  sprite(inner='rgba(255,255,255,1)',outer='rgba(139,108,240,0)',mid){
    const key=inner+outer+(mid||'');
    if(this._sprites[key]) return this._sprites[key];
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const x=cv.getContext('2d');
    const g=x.createRadialGradient(64,64,2,64,64,62);
    g.addColorStop(0,inner); if(mid) g.addColorStop(.4,mid); g.addColorStop(1,outer);
    x.fillStyle=g; x.beginPath(); x.arc(64,64,62,0,7); x.fill();
    const t=new THREE.CanvasTexture(cv);
    this._sprites[key]=t; return t; },

  /* -------- drifting particle field -------- */
  particles(n,spread,{color='#cdbcf7',size=.5,opacity=.6,ySpread}={}){
    const geo=new THREE.BufferGeometry();
    const pos=new Float32Array(n*3), seed=new Float32Array(n);
    for(let i=0;i<n;i++){ pos[i*3]=(Math.random()-.5)*spread;
      pos[i*3+1]=(Math.random()-.5)*(ySpread||spread);
      pos[i*3+2]=(Math.random()-.5)*spread; seed[i]=Math.random()*10; }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(geo,new THREE.PointsMaterial({ size, map:this.sprite('rgba(255,255,255,.9)','rgba(139,108,240,0)'),
      color:new THREE.Color(color), transparent:true, opacity, depthWrite:false, blending:THREE.AdditiveBlending }));
    pts.userData.seed=seed; pts.userData.base=pos.slice();
    pts.userData.drift=(t,amp=.35)=>{ if(document.documentElement.dataset.motion==='reduced') return;
      const p=geo.attributes.position.array,b=pts.userData.base;
      for(let i=0;i<n;i++){ p[i*3]=b[i*3]+Math.sin(t*.3+seed[i])*amp;
        p[i*3+1]=b[i*3+1]+Math.cos(t*.22+seed[i]*1.7)*amp*.7; }
      geo.attributes.position.needsUpdate=true; };
    return pts; },

  /* -------- luminous orbital ring -------- */
  ring(r,hex='#cdbcf7',opacity=.4,tube=.012){
    const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,140),
      new THREE.MeshBasicMaterial({color:new THREE.Color(hex),transparent:true,opacity,
        blending:THREE.AdditiveBlending,depthWrite:false}));
    return m; },

  glowSprite(hex,scale=1,opacity=.8){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:this.sprite('rgba(255,255,255,.95)','rgba(0,0,0,0)','rgba(180,160,255,.35)'),
      color:new THREE.Color(hex), transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false }));
    sp.scale.setScalar(scale); return sp; },
};
