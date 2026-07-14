'use strict';
/* ════════════════════════════════════════════════════════════
   WORLD ATLAS — an orrery of material realms
   Six miniature worlds orbit the Research Core.
   ════════════════════════════════════════════════════════════ */
const Atlas={ st:null, worlds:[], sel:null, hover:null, drag:null,
  az:.6, tilt:.42, dist:26, azT:.6, tiltT:.42, distT:26, focus:null,
  order:['foundry','ceramic','polymer','nexus','composite','bio'],

init(){ this.wrap=$('#atlas-wrap'); this.cv=$('#atlas-canvas');
  if(HAS3D){ this.build(); this.loop(); } else this.fallback2D();
  this.bindPointer(); this.buildLabels(); },

/* ---------- realm world builders ---------- */
worldBase(color){ const g=new THREE.Group();
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(2.3,1.5,.7,9,1),
    new THREE.MeshPhysicalMaterial({color:0x14121f,metalness:.4,roughness:.6,envMapIntensity:.8,flatShading:true}));
  disc.position.y=-.55; g.add(disc);
  const under=new THREE.Mesh(new THREE.ConeGeometry(1.5,2.4,9),
    new THREE.MeshPhysicalMaterial({color:0x0c0b16,metalness:.5,roughness:.55,flatShading:true}));
  under.rotation.x=Math.PI; under.position.y=-2.05; g.add(under);
  g.add(GFX.glowSprite(color,7,.22));
  const ring=GFX.ring(3.1,color,.3,.014); ring.rotation.x=Math.PI/2; g.add(ring);
  return g; },
buildFoundry(){ const R=REGIONS.foundry, g=this.worldBase(R.color);
  const lava=new THREE.MeshPhysicalMaterial({color:0x1a0d08,metalness:.3,roughness:.7,flatShading:true,
    emissive:0xff5a1e,emissiveIntensity:.55});
  const dark=new THREE.MeshPhysicalMaterial({color:0x171017,metalness:.75,roughness:.4,flatShading:true,
    emissive:0x40140a,emissiveIntensity:.35});
  for(let i=0;i<11;i++){ const h=.7+((i*37)%12)/7;
    const spire=new THREE.Mesh(new THREE.ConeGeometry(.16+((i*13)%5)/22,h,5),i%3?dark:lava);
    const a=i/11*Math.PI*2; spire.position.set(Math.cos(a)*(0.4+((i*7)%11)/9),h/2-.2,Math.sin(a)*(0.4+((i*17)%11)/9));
    g.add(spire); }
  // molten river ring
  const riv=new THREE.Mesh(new THREE.TorusGeometry(1.55,.05,6,64),
    new THREE.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:.85,blending:THREE.AdditiveBlending}));
  riv.rotation.x=Math.PI/2; riv.position.y=-.15; g.add(riv);
  const l=new THREE.PointLight(0xff5a1e,1.6,9); l.position.y=1; g.add(l);
  const sparks=GFX.particles(40,3.4,{color:'#ff8a4c',size:.24,opacity:.9,ySpread:3}); g.add(sparks);
  g.userData.anim=(t,rm)=>{ if(!rm){ sparks.userData.drift(t*2,.5);
    riv.material.opacity=.65+.25*Math.sin(t*3); l.intensity=1.4+.5*Math.sin(t*2.4); } };
  return g; },
buildCeramic(){ const R=REGIONS.ceramic, g=this.worldBase(R.color);
  const pale=new THREE.MeshPhysicalMaterial({color:0xd9d3c4,metalness:.05,roughness:.35,flatShading:true,
    envMapIntensity:1.4,transmission:.15,transparent:true,opacity:.97});
  const glassM=GFX.glass('#cfe4ea',.35);
  for(let i=0;i<8;i++){ const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.3+((i*29)%9)/16,0),pale);
    const a=i/8*Math.PI*2+.4; s.position.set(Math.cos(a)*(0.5+((i*11)%9)/9),.15+((i*7)%6)/9,Math.sin(a)*(0.5+((i*23)%9)/9));
    s.rotation.set(i,i*.7,0); g.add(s); }
  for(let i=0;i<7;i++){ const shard=new THREE.Mesh(new THREE.ConeGeometry(.07,.9+((i*31)%8)/8,4),glassM);
    const a=i/7*Math.PI*2+1.2; shard.position.set(Math.cos(a)*1.15,.4,Math.sin(a)*1.15); g.add(shard); }
  const l=new THREE.PointLight(0xbfe2ee,1.1,9); l.position.set(0,2,1); g.add(l);
  const mist=GFX.particles(34,3,{color:'#e8f2f4',size:.3,opacity:.5,ySpread:2}); g.add(mist);
  g.userData.anim=(t,rm)=>{ if(!rm) mist.userData.drift(t*.7,.4); };
  return g; },
buildPolymer(){ const R=REGIONS.polymer, g=this.worldBase(R.color);
  const bio=new THREE.MeshPhysicalMaterial({color:0x2a4a2e,metalness:.05,roughness:.55,
    emissive:0x2f8a48,emissiveIntensity:.3,transmission:.2,transparent:true,opacity:.95});
  const canopies=[];
  for(let i=0;i<7;i++){ const c=new THREE.Mesh(new THREE.SphereGeometry(.34+((i*19)%8)/14,10,10),bio);
    const a=i/7*Math.PI*2; c.position.set(Math.cos(a)*(0.55+((i*13)%7)/9),.55+((i*11)%7)/10,Math.sin(a)*(0.55+((i*7)%7)/9));
    c.scale.y=.75; g.add(c); canopies.push(c);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,.7,5),bio);
    trunk.position.set(c.position.x,.1,c.position.z); g.add(trunk); }
  // chain vines
  const vine=new THREE.Mesh(new THREE.TorusKnotGeometry(.9,.03,64,6,2,3),
    new THREE.MeshBasicMaterial({color:0x8fd8a8,transparent:true,opacity:.35,blending:THREE.AdditiveBlending}));
  vine.position.y=.7; g.add(vine);
  const l=new THREE.PointLight(0x6fd890,1.2,9); l.position.y=1.6; g.add(l);
  const fire=GFX.particles(36,3,{color:'#c8e89a',size:.22,opacity:.85,ySpread:2.4}); g.add(fire);
  g.userData.anim=(t,rm)=>{ if(!rm){ fire.userData.drift(t*1.4,.5); vine.rotation.y=t*.15;
    canopies.forEach((c,i)=>c.scale.setScalar(1+.05*Math.sin(t*1.4+i))); } };
  return g; },
buildNexus(){ const R=REGIONS.nexus, g=this.worldBase(R.color);
  const cry=new THREE.MeshPhysicalMaterial({color:0x8a97e8,metalness:.15,roughness:.06,transmission:.55,
    transparent:true,opacity:.92,emissive:0x5560d8,emissiveIntensity:.4,envMapIntensity:1.8,flatShading:true});
  const towers=[];
  for(let ix=-2;ix<=2;ix++) for(let iz=-2;iz<=2;iz++){ if(Math.abs(ix)+Math.abs(iz)>3) continue;
    const h=.4+((Math.abs(ix*7+iz*13)*29)%14)/6 + (ix===0&&iz===0?1.6:0);
    const tw=new THREE.Mesh(new THREE.BoxGeometry(.22,h,.22),cry);
    tw.position.set(ix*.42,h/2,iz*.42); g.add(tw); towers.push(tw); }
  // electron river
  const path=[]; for(let i=0;i<=40;i++){ const a=i/40*Math.PI*2;
    path.push(new THREE.Vector3(Math.cos(a)*1.7,.06+Math.sin(a*3)*.08,Math.sin(a)*1.7)); }
  const river=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path,true),80,.03,6),
    new THREE.MeshBasicMaterial({color:0x93dcf4,transparent:true,opacity:.8,blending:THREE.AdditiveBlending}));
  g.add(river);
  const bead=GFX.glowSprite('#c9ecfa',.8,1); g.add(bead);
  const l=new THREE.PointLight(0x8b6cf0,1.6,10); l.position.y=2.2; g.add(l);
  const storm=GFX.glowSprite('#c58af8',5,.14); storm.position.set(1.4,2.6,-1); g.add(storm);
  g.userData.anim=(t,rm)=>{ if(!rm){ const a=t*.8;
    bead.position.set(Math.cos(a)*1.7,.1,Math.sin(a)*1.7);
    towers.forEach((tw,i)=>{ tw.material===cry&&0; });
    storm.material.opacity=.1+.08*Math.sin(t*1.7); } };
  return g; },
buildComposite(){ const R=REGIONS.composite, g=this.worldBase(R.color);
  const lam=new THREE.MeshPhysicalMaterial({color:0x574a86,metalness:.3,roughness:.4,flatShading:true,
    emissive:0x2f2360,emissiveIntensity:.35,envMapIntensity:1.2});
  for(let i=0;i<9;i++){ const slab=new THREE.Mesh(new THREE.BoxGeometry(1.6-((i*7)%5)/8,.12,.9-((i*11)%4)/9),lam);
    slab.position.set(((i*13)%7-3)/6,.1+i*.22,((i*17)%7-3)/7);
    slab.rotation.y=i*.5; slab.rotation.z=(i%2?.06:-.06); g.add(slab); }
  const fib=new THREE.Mesh(new THREE.TorusGeometry(1.05,.05,8,60),GFX.iridescent('#b8a8e8',.4));
  fib.rotation.x=Math.PI/2.4; fib.position.y=1.15; g.add(fib);
  const fib2=fib.clone(); fib2.rotation.x=Math.PI/1.7; fib2.position.y=.9; g.add(fib2);
  const l=new THREE.PointLight(0xa88ce8,1.15,9); l.position.y=2; g.add(l);
  g.userData.anim=(t,rm)=>{ if(!rm){ fib.rotation.z=t*.3; fib2.rotation.z=-t*.22; } };
  return g; },
buildBio(){ const R=REGIONS.bio, g=this.worldBase(R.color);
  const reefM=new THREE.MeshPhysicalMaterial({color:0x1d5a56,metalness:.02,roughness:.6,
    emissive:0x2fae9e,emissiveIntensity:.3,transmission:.25,transparent:true,opacity:.95});
  const membs=[];
  for(let i=0;i<10;i++){ const b=new THREE.Mesh(new THREE.ConeGeometry(.11+((i*29)%6)/26,.5+((i*31)%11)/9,7),reefM);
    const a=i/10*Math.PI*2; b.position.set(Math.cos(a)*(0.45+((i*13)%8)/9),.25,Math.sin(a)*(0.45+((i*23)%8)/9));
    b.rotation.set(((i*7)%5-2)/9,0,((i*11)%5-2)/9); g.add(b); }
  for(let i=0;i<4;i++){ const mm=new THREE.Mesh(new THREE.SphereGeometry(.24+i*.05,14,14),GFX.glass('#7fe8c8',.28));
    const a=i*1.9; mm.position.set(Math.cos(a)*.9,.55+i*.14,Math.sin(a)*.9); g.add(mm); membs.push(mm); }
  const l=new THREE.PointLight(0x4fd8c0,1.3,9); l.position.y=1.6; g.add(l);
  const plank=GFX.particles(44,3,{color:'#8ff2dc',size:.2,opacity:.8,ySpread:2.2}); g.add(plank);
  g.userData.anim=(t,rm)=>{ if(!rm){ plank.userData.drift(t,.5);
    membs.forEach((mp,i)=>mp.scale.setScalar(1+.09*Math.sin(t*1.8+i*2))); } };
  return g; },

build(){ const st=GFX.stage(this.cv,{bloom:.9,fov:44}); this.st=st;
  st.scene.fog=new THREE.FogExp2(0x04040c,.014);
  st.scene.add(new THREE.AmbientLight(0x8a82c4,.4));
  const key=new THREE.DirectionalLight(0xfff2df,.75); key.position.set(8,14,6); st.scene.add(key);
  /* research core */
  const core=new THREE.Group();
  const heart=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,2),
    new THREE.MeshPhysicalMaterial({color:0xf3eefe,metalness:.2,roughness:.08,emissive:0xcabdf5,
      emissiveIntensity:.85,transmission:.5,transparent:true,opacity:.95,envMapIntensity:2,clearcoat:1,flatShading:true}));
  core.add(heart); this.coreHeart=heart;
  core.add(GFX.glowSprite('#cabdf5',8,.5));
  const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,1),GFX.glass('#cdbcf7',.13)); core.add(shell);
  this.coreShell=shell;
  // beam
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.16,10,8,1,true),
    new THREE.MeshBasicMaterial({color:0x93dcf4,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  beam.position.y=5.4; core.add(beam); this.coreBeam=beam;
  st.scene.add(core); this.core=core;
  /* orbit rings */
  [8.4,11.5,14.6].forEach((r,i)=>{ const ring=GFX.ring(r,'#cdbcf7',.1-i*.02,.012);
    ring.rotation.x=Math.PI/2; ring.scale.z=.62; st.scene.add(ring); });
  /* worlds */
  const builders={foundry:'buildFoundry',ceramic:'buildCeramic',polymer:'buildPolymer',
    nexus:'buildNexus',composite:'buildComposite',bio:'buildBio'};
  this.order.forEach((k,i)=>{ const w=this[builders[k]]();
    w.userData.key=k; w.userData.i=i; w.userData.orbitR= i%2? 11.5 : 8.6;
    w.userData.orbitPh=i/6*Math.PI*2;
    // fog of war shroud
    const shroud=new THREE.Mesh(new THREE.SphereGeometry(2.9,18,18),
      new THREE.MeshPhysicalMaterial({color:0x241f3e,metalness:0,roughness:.9,transparent:true,opacity:.72,depthWrite:false}));
    shroud.scale.y=.8; w.add(shroud); w.userData.shroud=shroud;
    // hit proxy
    const hit=new THREE.Mesh(new THREE.SphereGeometry(3.1,8,8),
      new THREE.MeshBasicMaterial({visible:false}));
    w.add(hit); w.userData.hit=hit;
    // anomaly marker for nexus
    if(k==='nexus'){ const an=GFX.glowSprite('#f0a8f8',1.6,.95); an.position.set(2.2,3,0);
      w.add(an); w.userData.anomaly=an; }
    this.st.scene.add(w); this.worlds.push(w); });
  /* dust */
  this.neb=GFX.particles(S.settings.fx==='low'?200:640,66,{color:'#9a8dd4',size:.42,opacity:.42,ySpread:26});
  st.scene.add(this.neb);
  this.ray=new THREE.Raycaster(); this.pointerV=new THREE.Vector2();
},
buildLabels(){ const holder=document.createElement('div');
  holder.id='atlas-labels'; holder.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:3';
  this.wrap.appendChild(holder);
  this.labels={};
  this.order.forEach(k=>{ const R=REGIONS[k];
    const el=document.createElement('div');
    el.style.cssText='position:absolute;transform:translate(-50%,0);text-align:center;transition:opacity .3s;text-shadow:0 2px 8px #000';
    el.innerHTML=`<div style="font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.28em;color:var(--pearl)">${R.name.toUpperCase()}</div>
      <div class="mono" data-lsub style="font-size:8.5px;letter-spacing:.18em;color:var(--bone-dim);margin-top:3px">—</div>`;
    holder.appendChild(el); this.labels[k]=el; }); },
bindPointer(){ const cv=this.cv;
  cv.addEventListener('pointerdown',e=>{ this.drag={x:e.clientX,y:e.clientY,az:this.azT,tilt:this.tiltT,moved:false};
    cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove',e=>{ const r=cv.getBoundingClientRect();
    this.mx=(e.clientX-r.left)/r.width*2-1; this.my=-((e.clientY-r.top)/r.height*2-1);
    if(this.drag){ const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
      if(Math.hypot(dx,dy)>4) this.drag.moved=true;
      this.azT=this.drag.az-dx*.005; this.tiltT=clamp(this.drag.tilt+dy*.004,.12,1.2); } });
  cv.addEventListener('pointerup',()=>{ if(this.drag&&!this.drag.moved){
      if(this.hover) this.select(this.hover); else this.closePanel(); }
    this.drag=null; });
  cv.addEventListener('wheel',e=>{ e.preventDefault(); this.distT=clamp(this.distT+e.deltaY*.02,14,40); },{passive:false});
},
regionStats(key){ const ids=MAT_LIST.filter(id=>MATERIALS[id].region===key);
  const d=ids.filter(id=>S.discovered[id]).length;
  return {ids,d,pct:ids.length?Math.round(d/ids.length*100):0}; },
select(key){ this.sel=key; this.focus=key; Sound.glass();
  if(window.Quests&&Quests.event) Quests.event('atlas-select',{key});
  const R=REGIONS[key], st=this.regionStats(key);
  S.regionsVisited[key]=true; save();
  const p=$('#realm-panel'); p.classList.add('open');
  p.innerHTML=`<div class="panel-title" style="padding-left:0">Selected Realm</div>
    <h2 class="mega" style="font-size:32px;padding:0 4px 4px">${R.name}</h2>
    <div class="row" style="gap:10px;padding:4px"><b class="mono" style="color:${R.color};font-weight:400">${st.pct}% discovered</b>
      <span class="tiny dim">${st.d} / ${st.ids.length} materials</span></div>
    <div id="realm-art" style="background:radial-gradient(ellipse at 50% 85%,${R.color}3c,transparent 70%),linear-gradient(180deg,rgba(8,8,18,.3),rgba(4,4,10,.85))">
      <canvas id="realm-art-cv" width="620" height="316" style="width:100%;height:100%"></canvas></div>
    <p style="font-size:12px;line-height:1.7;color:var(--pearl-dim);padding:0 4px">${R.blurb}</p>
    <p class="tiny" style="font-style:italic;color:var(--lilac);padding:8px 4px;line-height:1.6">“${R.env}”</p>
    <div class="eyebrow" style="margin:12px 4px 8px">Region hazards</div>
    <div class="row wrap" style="gap:6px;padding:0 4px">${R.hazards.map(h=>`<span class="hazard">⚠ ${h}</span>`).join('')}</div>
    <div class="eyebrow" style="margin:16px 4px 8px">Materials detected</div>
    <div style="padding:0 4px">${st.ids.map(id=>{ const m=MATERIALS[id],d=S.discovered[id];
      return `<div class="taxo-item ${d?'':'undisc'}" data-ra="${id}">
        <span class="dot" style="background:${d?m.color:'transparent'};border:1px solid ${m.color};box-shadow:${d?'0 0 9px '+m.color:'none'}"></span>
        <span>${d?m.name:'??? — anomalous signature'}</span>
        <span class="mono tiny dim" style="margin-left:auto">${m.code}</span></div>`; }).join('')}</div>
    <div class="ctl-group" style="margin:16px 4px">
      <button class="ctl sm primary" id="realm-enter">Enter region</button>
      ${key==='nexus'?'<button class="ctl sm" id="realm-exp">Track optional expedition</button>':''}
      <button class="ctl sm" id="realm-close">Close</button></div>
    ${key!=='nexus'?'<p class="tiny dim" style="padding:0 4px">Explore this realm freely. No guided expedition is currently catalogued here.</p>':''}`;
  $$('#realm-panel [data-ra]').forEach(el=>el.addEventListener('click',()=>{ Codex.show(el.dataset.ra); nav('codex'); }));
  $('#realm-enter').addEventListener('click',()=>{ nav('index'); $('#idx-search').value='';
    Constellation.filters.family.clear();
    $$('#flt-family .chip').forEach(c=>c.classList.remove('on'));
    Object.entries(FAMILIES).forEach(([fk,f],i)=>{ if(f.region===key){ Constellation.filters.family.add(fk);
      $$('#flt-family .chip')[i].classList.add('on'); } });
    Constellation.applyFilters(); toast(`Entering ${R.name} — constellation filtered`); });
  if($('#realm-exp')) $('#realm-exp').addEventListener('click',()=>{ if(window.Quests) Quests.trackArc('first'); nav('expedition'); });
  $('#realm-close').addEventListener('click',()=>this.closePanel());
  /* mini art */
  const rc=$('#realm-art-cv'); if(rc){ const rx=rc.getContext('2d'); const col=R.color;
    for(let i=0;i<30;i++){ const x=40+Math.random()*540, hgt=20+Math.random()*150, wd=6+Math.random()*22;
      rx.fillStyle=col+(Math.random()<.5?'26':'44');
      if(key==='polymer'||key==='bio'){ rx.beginPath(); rx.ellipse(x,316-hgt/2,wd,hgt/2,0,0,7); rx.fill(); }
      else{ rx.fillRect(x,316-hgt,wd,hgt); } }
    rx.fillStyle=col+'aa'; for(let i=0;i<50;i++) rx.fillRect(Math.random()*620,Math.random()*270,1.4,1.4); }
},
closePanel(){ this.sel=null; this.focus=null; $('#realm-panel').classList.remove('open'); },
loop(){ requestAnimationFrame(()=>this.loop());
  if(CURRENT!=='atlas'||!this.st) return;
  const st=this.st; st.setSize(this.wrap.clientWidth,this.wrap.clientHeight);
  const t=now()/1000; const rm=document.documentElement.dataset.motion==='reduced';
  /* worlds orbit + idle */
  this.worlds.forEach(w=>{ const spd=rm?0:.018;
    const a=w.userData.orbitPh + t*spd*(w.userData.orbitR>10?.7:1);
    w.position.set(Math.cos(a)*w.userData.orbitR,Math.sin(a*2)*.4,Math.sin(a)*w.userData.orbitR*.62);
    const st_=this.regionStats(w.userData.key);
    w.userData.shroud.visible = st_.pct===0;
    if(!rm){ w.rotation.y += (this.hover===w.userData.key? .012 : .0035);
      if(w.userData.anim) w.userData.anim(t,rm);
      if(w.userData.anomaly){ w.userData.anomaly.visible=!S.achievements['bandgap'];
        w.userData.anomaly.material.opacity=.55+.45*Math.sin(t*3); } }
    const target=this.hover===w.userData.key||this.sel===w.userData.key? 1.18:1;
    w.scale.setScalar(lerp(w.scale.x,target,.08)); });
  /* core */
  if(!rm){ this.core.rotation.y=t*.1; this.coreHeart.rotation.y=-t*.2;
    this.coreShell.rotation.z=t*.06;
    this.coreHeart.material.emissiveIntensity=.75+.2*Math.sin(t*2);
    this.coreBeam.material.opacity=.2+.12*Math.sin(t*1.7);
    this.neb.userData.drift(t,.5); }
  /* camera */
  this.az=lerp(this.az,this.azT,.06); this.tilt=lerp(this.tilt,this.tiltT,.06);
  this.dist=lerp(this.dist,this.distT,.06);
  let cx=0,cz=0,cy=0,d=this.dist;
  if(this.focus){ const w=this.worlds.find(x=>x.userData.key===this.focus);
    if(w){ cx=w.position.x*.55; cz=w.position.z*.55; cy=w.position.y*.5; d=Math.min(this.dist,19); } }
  const cam=st.camera;
  cam.position.x=lerp(cam.position.x,cx+Math.sin(this.az)*d*Math.cos(this.tilt),.07);
  cam.position.z=lerp(cam.position.z,cz+Math.cos(this.az)*d*Math.cos(this.tilt),.07);
  cam.position.y=lerp(cam.position.y,cy+Math.sin(this.tilt)*d,.07);
  cam.lookAt(cx*.5,cy*.4,cz*.5);
  /* picking */
  if(this.mx!==undefined&&!this.drag){ this.pointerV.set(this.mx,this.my);
    this.ray.setFromCamera(this.pointerV,cam);
    const hits=this.ray.intersectObjects(this.worlds.map(w=>w.userData.hit));
    this.hover= hits.length? hits[0].object.parent.userData.key : null;
    this.cv.style.cursor=this.hover?'pointer':'grab'; }
  st.render();
  /* labels */
  const v=new THREE.Vector3(); const rect={w:this.wrap.clientWidth,h:this.wrap.clientHeight};
  this.worlds.forEach(w=>{ const el=this.labels[w.userData.key]; if(!el) return;
    v.copy(w.position); v.y-=3.4; v.project(cam);
    const sx=(v.x*.5+.5)*rect.w, sy=(-v.y*.5+.5)*rect.h;
    const depth=(v.z+1)/2;
    el.style.left=sx+'px'; el.style.top=sy+'px';
    el.style.opacity= v.z>1? 0 : clamp(1.25-depth*.9,.25,1);
    const st_=this.regionStats(w.userData.key);
    el.querySelector('[data-lsub]').textContent= st_.pct===0? 'UNCHARTED' : st_.pct+'% DISCOVERED · '+st_.d+' ◆'; });
},
fallback2D(){ const ctx=this.cv.getContext('2d');
  const draw=()=>{ const w=this.wrap.clientWidth,h=this.wrap.clientHeight;
    this.cv.width=w; this.cv.height=h; ctx.clearRect(0,0,w,h);
    this.order.forEach((k,i)=>{ const R=REGIONS[k]; const a=i/6*Math.PI*2;
      const x=w/2+Math.cos(a)*w*.3, y=h/2+Math.sin(a)*h*.28;
      ctx.fillStyle=R.color; ctx.beginPath(); ctx.arc(x,y,26,0,7); ctx.fill();
      ctx.fillStyle='rgba(246,242,234,.8)'; ctx.font='10px "Archivo Narrow"'; ctx.textAlign='center';
      ctx.fillText(R.name.toUpperCase(),x,y+44); });
    ctx.fillStyle='#efeaff'; ctx.beginPath(); ctx.arc(w/2,h/2,18,0,7); ctx.fill(); };
  draw(); window.addEventListener('resize',draw);
  this.cv.addEventListener('click',e=>{ const r=this.cv.getBoundingClientRect();
    const w=r.width,h=r.height,px=e.clientX-r.left,py=e.clientY-r.top;
    this.order.forEach((k,i)=>{ const a=i/6*Math.PI*2;
      const x=w/2+Math.cos(a)*w*.3, y=h/2+Math.sin(a)*h*.28;
      if(Math.hypot(px-x,py-y)<34) this.select(k); }); });
} };
function renderAtlasStatus(){ const el=$('#atlas-status-body'); if(!el) return;
  const totDisc=Object.keys(S.discovered).length;
  const visited=Object.keys(S.regionsVisited).length;
  el.innerHTML=`
    <div class="kv"><span>Realms surveyed</span><b>${visited} / 6</b></div>
    <div class="kv"><span>Materials catalogued</span><b>${totDisc} / ${MAT_LIST.length}</b></div>
    <div class="kv"><span>Expeditions completed</span><b>${S.expeditionsDone}</b></div>
    <div class="kv"><span>Marked locations</span><b>${S.markedLocations.length}</b></div>
    <p class="tiny dim" style="margin-top:8px;line-height:1.5">Drag to orbit · scroll to zoom · click a realm to survey it.</p>`; }
SCREEN_HOOKS.atlas={enter(){ renderAtlasStatus(); }};
