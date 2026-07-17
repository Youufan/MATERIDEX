'use strict';
/* ════════════════════════════════════════════════════════════
   CODEX — the specimen chamber. Graphene as an impossible artefact.
   ════════════════════════════════════════════════════════════ */

/* ---------- procedural specimen factory (Codex hero + Collection) ---------- */
function specimenGroup(id){
  const m=MATERIALS[id], g=new THREE.Group(), col=new THREE.Color(m.color);
  const rnd=(seed=>()=> (seed=(seed*16807)%2147483647)/2147483647)(id.length*7919+id.charCodeAt(0)*131);
  const glow=(s,o)=>{ const sp=GFX.glowSprite(m.color,s,o); g.add(sp); return sp; };
  switch(m.specimen){
    case 'tube':{ glow(3.4,.22);
      const geo=new THREE.CylinderGeometry(.5,.5,3.4,28,1,true);
      g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true,opacity:.55})));
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,3.2,20,1,true),GFX.glass(m.color,.2)));
      g.rotation.z=.5; break; }
    case 'gem':{ glow(4,.3);
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.35,0),GFX.crystal(m.color)));
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.37,0),new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true,opacity:.3}))); break; }
    case 'smoke':{ glow(3.6,.2);
      for(let i=0;i<9;i++){ const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.34+rnd()*.6,1),
        new THREE.MeshPhysicalMaterial({color:col,transparent:true,opacity:.12+rnd()*.1,roughness:.95,metalness:0,
          emissive:col.clone().multiplyScalar(.3),transmission:.4}));
        s.position.set((rnd()-.5)*1.8,(rnd()-.5)*1.6,(rnd()-.5)*1.6); s.scale.y=.7+rnd()*.6; g.add(s);} break; }
    case 'layers':{ glow(3.4,.2);
      for(let i=0;i<5;i++){ const p=new THREE.Mesh(new THREE.BoxGeometry(2.4,.055,1.7),GFX.iridescent(m.color,.5));
        p.position.y=(i-2)*.3; p.rotation.y=i*.06; g.add(p);} break; }
    case 'web':{ glow(3,.24); const pts=[];
      for(let i=0;i<70;i++){ const a=rnd()*Math.PI*2,r=.4+rnd()*1.2;
        pts.push(new THREE.Vector3(Math.cos(a)*r,(rnd()-.5)*2,Math.sin(a)*r)); }
      const geo=new THREE.BufferGeometry().setFromPoints(pts.flatMap((p,i)=>i?[pts[i-1],p]:[]));
      g.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.6,blending:THREE.AdditiveBlending}))); break; }
    case 'blob':{ glow(3.6,.18);
      const geo=new THREE.SphereGeometry(1.1,64,64); const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){ const v=new THREE.Vector3().fromBufferAttribute(pos,i);
        const d=1+.16*Math.sin(v.x*4)*Math.sin(v.y*3+1)*Math.sin(v.z*5); v.multiplyScalar(d); pos.setXYZ(i,v.x,v.y,v.z);}
      geo.computeVertexNormals(); g.add(new THREE.Mesh(geo,GFX.chrome('#e8eaf2',.05))); break; }
    case 'ingot':{ glow(3,.16);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(.85,.95,2.6,48),GFX.chrome(m.color,.3)));
      g.rotation.z=.9; break; }
    case 'shard':{ glow(3.4,.22);
      g.add(new THREE.Mesh(new THREE.ConeGeometry(.75,2.6,6),GFX.crystal(m.color)));
      const s2=new THREE.Mesh(new THREE.ConeGeometry(.4,1.6,5),GFX.crystal(m.color));
      s2.position.set(.7,-.5,.2); s2.rotation.z=-.4; g.add(s2); break; }
    case 'pane':{ glow(3,.14);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(2.3,2.9,.08),GFX.glass(m.color,.3))); break; }
    case 'lattice3d':{ glow(3.4,.18);
      const sp=new THREE.SphereGeometry(.14,16,16); const mat=GFX.chrome(m.color,.2);
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
        const s=new THREE.Mesh(sp,mat); s.position.set(x*.85,y*.85,z*.85); g.add(s); }
      const lp=[]; for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++){
        lp.push(new THREE.Vector3(x*.85,y*.85,-.85),new THREE.Vector3(x*.85,y*.85,.85));
        lp.push(new THREE.Vector3(x*.85,-.85,y*.85),new THREE.Vector3(x*.85,.85,y*.85));
        lp.push(new THREE.Vector3(-.85,x*.85,y*.85),new THREE.Vector3(.85,x*.85,y*.85)); }
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp),
        new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.4,blending:THREE.AdditiveBlending}))); break; }
    case 'ribbon':{ glow(3.2,.18); const pts=[];
      for(let i=0;i<=80;i++){ const t=i/80*Math.PI*3.4;
        pts.push(new THREE.Vector3(Math.sin(t)*1.05,(i/80-.5)*2.4,Math.cos(t)*1.05)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.13,12),GFX.chrome('#eceef4',.06))); break; }
    case 'weave':{ glow(3.2,.16);
      for(let i=0;i<6;i++){ const c=new THREE.Mesh(new THREE.TorusGeometry(.9,.1,12,60),GFX.iridescent(m.color,.35));
        c.rotation.set(i*.55,i*.9,0); c.scale.setScalar(.75+i*.09); g.add(c);} break; }
    case 'coil':{ glow(3,.16); const pts=[];
      for(let i=0;i<=120;i++){ const t=i/120*Math.PI*7;
        pts.push(new THREE.Vector3(Math.cos(t)*.85,(i/120-.5)*2.2,Math.sin(t)*.85)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,.1,10),
        new THREE.MeshPhysicalMaterial({color:col,roughness:.5,metalness:.1,envMapIntensity:1.2}))); break; }
    case 'membrane':{ glow(3.6,.2);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1.15,48,48),GFX.glass(m.color,.3)));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(.7,32,32),GFX.glass(m.color,.2)));
      g.userData.breathe=true; break; }
    case 'bloom':{ glow(3.4,.22);
      for(let i=0;i<10;i++){ const petal=new THREE.Mesh(new THREE.SphereGeometry(.55,20,20),GFX.iridescent(m.color,.45));
        petal.material.opacity=.75; const a=i/10*Math.PI*2;
        petal.position.set(Math.cos(a)*.8,Math.sin(i)*.3,Math.sin(a)*.8);
        petal.scale.set(1,.35,.55); petal.lookAt(0,0,0); g.add(petal);} break; }
    case 'reef':{ glow(3.4,.2);
      for(let i=0;i<12;i++){ const b=new THREE.Mesh(new THREE.ConeGeometry(.16+rnd()*.2,.7+rnd()*1.2,8),
        new THREE.MeshPhysicalMaterial({color:col,roughness:.7,metalness:.05,transmission:.3,transparent:true,
          opacity:.95,emissive:col.clone().multiplyScalar(.25)}));
        b.position.set((rnd()-.5)*1.9,-.7+rnd()*.4,(rnd()-.5)*1.9);
        b.rotation.set((rnd()-.5)*.5,0,(rnd()-.5)*.5); g.add(b);} break; }
    default:{ glow(3.4,.2); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,1),GFX.crystal(m.color))); } }
  return g;
}

/* ---------- graphene veil — instanced atoms, bond cylinders, halo ---------- */
function buildVeil(scene){
  const V={group:new THREE.Group(), mode:'ballstick', defects:new Set(), hot:[]};
  const a=0.5, W=26, H=15, pts=[], idx={}; let n=0;
  for(let r=0;r<H;r++) for(let c=0;c<W;c++){
    pts.push([c*a*1.5+(r%2?a*.75:0) - W*a*.72, r*a*.866 - H*a*.43]); idx[r+'_'+c]=n++; }
  const N=pts.length;
  [187,88,301].forEach(i=>V.defects.add(i%N));
  V.pts=pts; V.N=N; V.zbuf=new Float32Array(N);
  const atomGeo=new THREE.SphereGeometry(.072,14,14);
  V.atoms=new THREE.InstancedMesh(atomGeo,GFX.iridescent('#ded6f4',.75),N);
  V.atoms.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  V.embers=new THREE.Group();
  V.defects.forEach(i=>{ const e=GFX.glowSprite('#ff5a36',.6,.9); e.userData.i=i; V.embers.add(e); });
  const pairs=[];
  const near=(i,j)=>{ const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1]; return dx*dx+dy*dy<(a*1.05)*(a*1.05); };
  for(let i=0;i<N;i++) for(let j=i+1;j<Math.min(N,i+W*2+4);j++) if(near(i,j)) pairs.push([i,j]);
  V.pairs=pairs;
  const bondGeo=new THREE.CylinderGeometry(.031,.031,1,6,1,true);
  const bondMat=new THREE.MeshPhysicalMaterial({color:0xcabdf5,metalness:.7,roughness:.25,
    envMapIntensity:1.6,transparent:true,opacity:.96,emissive:0x6f5cd0,emissiveIntensity:.5});
  V.bonds=new THREE.InstancedMesh(bondGeo,bondMat,pairs.length);
  V.bonds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cn=(S.settings.fx==='low')?400:1600; const posC=new Float32Array(cn*3); V.cloudBase=[];
  for(let i=0;i<cn;i++){ const p=pts[Math.floor(Math.random()*N)];
    V.cloudBase.push([p[0]+(Math.random()-.5)*.4,p[1]+(Math.random()-.5)*.4,(Math.random()<.5?-1:1)*(.12+Math.random()*.22)]); }
  const geoC=new THREE.BufferGeometry(); geoC.setAttribute('position',new THREE.BufferAttribute(posC,3));
  V.cloud=new THREE.Points(geoC,new THREE.PointsMaterial({size:.14,map:GFX.sprite('rgba(220,245,255,.95)','rgba(80,140,255,0)'),
    color:0x93dcf4,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));
  V.sheet=new THREE.Mesh(new THREE.PlaneGeometry(W*a*1.5,H*a*.9,44,24),GFX.iridescent('#9a8fd8',.6));
  V.sheet.material.side=THREE.DoubleSide; V.sheet.material.opacity=.72;
  /* containment halo */
  V.halo=new THREE.Group();
  const r1=new THREE.Mesh(new THREE.TorusGeometry(8.8,.028,12,220),GFX.chrome('#dfdbe9',.14));
  r1.rotation.x=Math.PI/2.15;
  const r2=new THREE.Mesh(new THREE.TorusGeometry(9.8,.014,10,220),GFX.chrome('#b9c7de',.2));
  r2.rotation.x=Math.PI/1.9; r2.rotation.y=.35;
  const r3=GFX.ring(9.3,'#93dcf4',.16,.01); r3.rotation.x=Math.PI/2.05;
  V.halo.add(r1,r2,r3);
  V.beads=[];
  for(let i=0;i<3;i++){ const b=GFX.glowSprite(i?'#93dcf4':'#cdbcf7',.7,.9); V.halo.add(b); V.beads.push(b); }
  V.dust=GFX.particles(S.settings.fx==='low'?60:130,22,{color:'#a99df0',size:.26,opacity:.28,ySpread:9});
  V.underglow=GFX.glowSprite('#8b6cf0',16,.09); V.underglow.position.y=-5;
  V.group.add(V.atoms,V.bonds,V.cloud,V.sheet,V.embers,V.halo,V.dust,V.underglow);
  scene.add(V.group);
  V.hot=[{i:idx['7_6'],t:'σ-framework',d:'Each C–C σ-bond is ~0.142 nm — shorter and stronger than in diamond.'},
         {i:[...V.defects][0],t:'Vacancy defect',d:'A missing atom. Strength collapses here first — real sheets fail from sites like this.'},
         {i:idx['7_19'],t:'π-electron system',d:'Delocalised electrons above and below the plane carry the famous conductivity.'}];
  const M4=new THREE.Matrix4(), Q=new THREE.Quaternion(), UP=new THREE.Vector3(0,1,0),
        vA=new THREE.Vector3(), vB=new THREE.Vector3(), vD=new THREE.Vector3(), vS=new THREE.Vector3(1,1,1);
  V.update=(t)=>{
    const rm=document.documentElement.dataset.motion==='reduced';
    const ripple=(x,y)=> rm?0 : .24*Math.sin(x*1.1+t*.9)*Math.cos(y*1.4+t*.7)+.11*Math.sin((x+y)*2.1-t*1.3);
    for(let i=0;i<N;i++){ const p=pts[i];
      const z=V.defects.has(i)? ripple(p[0],p[1])+(rm?0:.06*Math.sin(t*5)) : ripple(p[0],p[1]);
      V.zbuf[i]=z;
      const s=V.defects.has(i)? .55 : 1;
      M4.compose(vA.set(p[0],p[1],z),Q.identity(),vS.set(s,s,s));
      V.atoms.setMatrixAt(i,M4); }
    V.atoms.instanceMatrix.needsUpdate=true;
    if(V.bonds.visible){ pairs.forEach((pr,k)=>{ const [i,j]=pr;
      vA.set(pts[i][0],pts[i][1],V.zbuf[i]); vB.set(pts[j][0],pts[j][1],V.zbuf[j]);
      vD.subVectors(vB,vA); const len=vD.length();
      Q.setFromUnitVectors(UP,vD.clone().normalize());
      M4.compose(vA.addScaledVector(vD,.5),Q,vS.set(1,len,1));
      V.bonds.setMatrixAt(k,M4); });
      V.bonds.instanceMatrix.needsUpdate=true; }
    if(V.cloud.visible){ const C=V.cloud.geometry.attributes.position.array;
      V.cloudBase.forEach((b,i)=>{ C[i*3]=b[0]+(rm?0:Math.sin(t*2+i)*.05);
        C[i*3+1]=b[1]+(rm?0:Math.cos(t*1.7+i*.7)*.05); C[i*3+2]=b[2]+ripple(b[0],b[1]); });
      V.cloud.geometry.attributes.position.needsUpdate=true; }
    if(V.sheet.visible){ const P=V.sheet.geometry.attributes.position;
      for(let i=0;i<P.count;i++){ P.setZ(i,ripple(P.getX(i),P.getY(i))); }
      P.needsUpdate=true; V.sheet.geometry.computeVertexNormals(); }
    V.embers.children.forEach(e=>{ const p=pts[e.userData.i];
      e.position.set(p[0],p[1],V.zbuf[e.userData.i]);
      e.material.opacity=.5+.4*(rm?0:Math.sin(t*4+e.userData.i)); });
    if(!rm){ V.halo.rotation.y=t*.05;
      V.beads.forEach((b,i)=>{ const ba=t*(.22+i*.07)+i*2.2;
        b.position.set(Math.cos(ba)*9.3,Math.sin(ba)*1.2,Math.sin(ba)*9.3); });
      V.dust.userData.drift(t,.4); } };
  /* unit cell + crystallographic axes (a₁, a₂) */
  V.cell=new THREE.Group();
  { const A1=new THREE.Vector3(.75,0,0), A2=new THREE.Vector3(.375,.433,0), O=new THREE.Vector3(-.36,-.215,.02);
    const lineM=new THREE.LineBasicMaterial({color:0xd9c9a5,transparent:true,opacity:.95});
    const quad=[O,O.clone().add(A1),O.clone().add(A1).add(A2),O.clone().add(A2),O];
    V.cell.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(quad),lineM));
    [[A1,'a₁'],[A2,'a₂']].forEach(([v,name])=>{ const dir=v.clone().normalize();
      const ar=new THREE.ArrowHelper(dir,O,v.length()+.28,0xd9c9a5,.14,.07); V.cell.add(ar);
      const cv2=document.createElement('canvas'); cv2.width=64; cv2.height=32;
      const x2=cv2.getContext('2d'); x2.font='22px Georgia'; x2.fillStyle='#d9c9a5'; x2.fillText(name,6,24);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv2),transparent:true,depthWrite:false}));
      sp.scale.set(.5,.25,1); sp.position.copy(O).addScaledVector(v,1).add(new THREE.Vector3(.14,.14,.1)); V.cell.add(sp); }); }
  V.cell.visible=false; V.group.add(V.cell);
  /* bond-length measurement label */
  V.measure=new THREE.Group();
  { const i0=idx['7_6'], i1=idx['7_7'];
    const p0=new THREE.Vector3(pts[i0][0],pts[i0][1],.02), p1=new THREE.Vector3(pts[i1][0],pts[i1][1],.02);
    const lm=new THREE.LineBasicMaterial({color:0x93dcf4,transparent:true,opacity:.95});
    V.measure.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p0.clone().add(new THREE.Vector3(0,.28,0)),p0,p1,p1.clone().add(new THREE.Vector3(0,.28,0))]),lm));
    const cv3=document.createElement('canvas'); cv3.width=256; cv3.height=56;
    const x3=cv3.getContext('2d'); x3.font='26px "IBM Plex Mono", monospace'; x3.fillStyle='#93dcf4';
    x3.fillText('a_CC = 0.142 nm',8,36);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv3),transparent:true,depthWrite:false}));
    sp.scale.set(2.1,.46,1); sp.position.copy(p0).lerp(p1,.5).add(new THREE.Vector3(0,.62,0)); V.measure.add(sp); }
  V.measure.visible=false; V.group.add(V.measure);
  V.setDefects=(on)=>{ V.embers.visible=on; };
  V.setMode=(mode)=>{ V.mode=mode;
    const quiet = mode==='bonds';
    V.atoms.visible = mode!=='continuum';
    V.atoms.material.opacity = mode==='electron'? .3 : mode==='bonds'? .55 : .98;
    V.atoms.material.transparent = true;
    V.bonds.visible = mode!=='continuum'||true;
    V.bonds.material.opacity = mode==='bonds'? 1 : mode==='electron'? .38 : mode==='continuum'? .3 : .96;
    V.bonds.material.emissiveIntensity = mode==='bonds'? .8 : mode==='continuum'? .2 : .5;
    V.cloud.visible = mode==='electron';
    V.sheet.visible = mode==='continuum';
    V.halo.visible = !quiet;
    V.dust.visible = !quiet && mode!=='electron';
    V.underglow.visible = !quiet; };
  V.setMode('lattice');
  return V;
}

/* ---------- codex controller ---------- */
const Codex={ id:null, st:null, spec:null, structure:null, rot:{x:-.5,y:.12}, zoom:7.4, drag:null, mouse:{x:0,y:0},
  mountToken:0,contextLost:false,renderFailed:false,failedId:null,
init(){
  this.stage=$('#specimen-stage'); this.cv=$('#specimen-canvas');
  if(HAS3D){ const st=GFX.stage(this.cv,{bloom:.18,fov:44}); this.st=st;
    st.scene.fog=new THREE.FogExp2(0x05050e,.009);
    st.scene.add(new THREE.HemisphereLight(0xdfe7f4,0x171526,.58));
    const key=new THREE.DirectionalLight(0xfff3dc,.72); key.position.set(4,7,8); st.scene.add(key);
    const fill=new THREE.DirectionalLight(0x9ec6e7,.32); fill.position.set(-6,-2,4); st.scene.add(fill);
    this.bgNeb=GFX.particles(S.settings.fx==='low'?90:220,60,{color:'#8f81c8',size:.34,opacity:.2,ySpread:34});
    this.bgNeb.position.z=-36; st.scene.add(this.bgNeb);
    this.raycaster=new THREE.Raycaster(); this.pointer=new THREE.Vector2(2,2);
    this.loop();
  } else this.fallback2D();
  this.bind(); const requested=new URLSearchParams(location.search).get('structure');
  this.show(requested&&STRUCTURE_DATA[requested]?requested:'graphene');
  if(requested&&STRUCTURE_DATA[requested])setTimeout(()=>nav('codex'),0);
},
loop(){ requestAnimationFrame(()=>this.loop());
  if(CURRENT!=='codex'||!this.st||this.contextLost||this.renderFailed) return;
  const t=now()/1000; const st=this.st;
  st.setSize(this.stage.clientWidth,this.stage.clientHeight);
  const rm=document.documentElement.dataset.motion==='reduced';
  const tx=this.rot.x+(this.drag?0:this.mouse.y*.05), ty=this.rot.y+(this.drag?0:this.mouse.x*.09);
  const g=this.spec;
  if(g){ g.rotation.x=lerp(g.rotation.x,tx,.07);
    g.rotation.y=lerp(g.rotation.y,ty+(rm?0:t*.045),.07);
    if(g.userData&&g.userData.breathe) g.scale.setScalar(2.3*(1+.04*Math.sin(t*1.8))); }
  if(this.specAnim) this.specAnim(t,rm);
  if(!rm&&this.bgNeb) this.bgNeb.userData.drift(t,.5);
  st.camera.position.x=lerp(st.camera.position.x,this.mouse.x*.5,.05);
  st.camera.position.y=lerp(st.camera.position.y,-this.mouse.y*.35,.05);
  st.camera.position.z=lerp(st.camera.position.z,this.zoom,.09);
  st.camera.lookAt(0,0,0);
  try{st.render();}catch(error){this.fail(this.id,error);return;}
  this.hotspots();
},
hotspots(){ const tip=$('#hotspot-tip');
  if(!this.structure||!this.raycaster||!this.structure.pickables.length){tip.style.opacity=0;return;}
  this.raycaster.setFromCamera(this.pointer,this.st.camera); const hit=this.raycaster.intersectObjects(this.structure.pickables,false)[0];
  if(!hit||hit.instanceId==null){tip.style.opacity=0;return;} const rec=hit.object.userData.atomInstances[hit.instanceId],el=ELEMENTS[rec.element],rect=this.stage.getBoundingClientRect();
  tip.innerHTML=`<b>${el.name} · ${rec.element}</b>${rec.role||'Structural atom'}${rec.occupancy!==1?`<br>Occupancy: ${rec.occupancy}`:''}`;
  tip.style.left=clamp((this.px||0)+18,10,rect.width-246)+'px';tip.style.top=clamp((this.py||0)-10,10,rect.height-90)+'px';tip.style.opacity=1;
},
bind(){
  const st=this.stage;
  st.addEventListener('click',e=>{if(e.target.closest('[data-codex-retry]')&&this.failedId)this.show(this.failedId);});
  this.cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.setState('paused','3D context paused. Waiting to restore…');});
  this.cv.addEventListener('webglcontextrestored',()=>{this.contextLost=false;const id=this.id;if(id){this.id=null;this.show(id);}});
  st.addEventListener('pointerdown',e=>{ this.drag={x:e.clientX,y:e.clientY,rx:this.rot.x,ry:this.rot.y}; st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointermove',e=>{ const rect=st.getBoundingClientRect();
    this.px=e.clientX-rect.left; this.py=e.clientY-rect.top;
    this.mouse.x=(this.px/rect.width-.5)*2; this.mouse.y=(this.py/rect.height-.5)*2;
    this.pointer.set(this.mouse.x,-this.mouse.y);
    if(this.drag){ this.rot.y=this.drag.ry+(e.clientX-this.drag.x)*.006;
      this.rot.x=clamp(this.drag.rx+(e.clientY-this.drag.y)*.006,-1.5,1.5); } });
  st.addEventListener('pointerup',()=>this.drag=null);
  st.addEventListener('wheel',e=>{ e.preventDefault(); this.zoom=clamp(this.zoom+e.deltaY*.011,4.2,19); },{passive:false});
  st.addEventListener('keydown',e=>{const move={ArrowLeft:[0,-.12],ArrowRight:[0,.12],ArrowUp:[-.12,0],ArrowDown:[.12,0]}[e.key];
    if(move){e.preventDefault();this.rot.x=clamp(this.rot.x+move[0],-1.5,1.5);this.rot.y+=move[1];}
    if(e.key==='+'||e.key==='='){e.preventDefault();this.zoom=clamp(this.zoom-.7,4.2,19);}
    if(e.key==='-'){e.preventDefault();this.zoom=clamp(this.zoom+.7,4.2,19);}});
  $$('.vm-btn').forEach(b=>b.addEventListener('click',()=>{ $$('.vm-btn').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); Sound.click(); if(this.structure) this.structure.setBonds(b.dataset.vm!=='lattice');
    if(this.bgNeb) this.bgNeb.material.opacity = b.dataset.vm==='bonds'? .05 : .2;
    const notes={lattice:'Lattice — carbon atoms in their honeycomb arrangement.',
      bonds:'Bond network — every σ-bond explicit; environment dimmed for readability.',
      electron:'Electron system — σ framework (dim bonds) plus the delocalised π cloud above and below the plane.',
      continuum:'Continuum — the physical sheet, lattice faintly visible beneath.'};
    toast(notes[b.dataset.vm]); }));
  /* structure toggles: defects · unit cell · labels */
  const tg=document.createElement('div'); tg.id='struct-toggles';
  tg.style.cssText='position:absolute;right:366px;top:calc(var(--hud-h) + 268px);z-index:8;display:flex;flex-direction:column;gap:6px';
  tg.innerHTML=['bonds','unit cell','labels'].map(k=>
    `<button class="chip ${k==='bonds'||k==='labels'?'on':''}" data-stg="${k}">${k}</button>`).join('');
  $('#scr-codex').appendChild(tg);
  $$('#struct-toggles [data-stg]').forEach(b=>b.addEventListener('click',()=>{
    b.classList.toggle('on'); const on=b.classList.contains('on'); Sound.click();
    if(!this.structure) return;
    if(b.dataset.stg==='bonds') this.structure.setBonds(on);
    if(b.dataset.stg==='unit cell') this.structure.setCell(on);
    if(b.dataset.stg==='labels') this.structure.setLabels(on); }));
  $('#act-scan').addEventListener('click',()=>this.scan());
  $('#act-sim').addEventListener('click',()=>{ Lab.setMaterial(this.id); nav('lab'); });
  $('#act-compare').addEventListener('click',()=>{ Loadout.addCompare(this.id); nav('loadout'); });
  $('#act-loadout').addEventListener('click',()=>{ Loadout.shelfAdd(this.id); nav('loadout'); });
  $('#act-track').addEventListener('click',()=>{ S.tracked[this.id]=!S.tracked[this.id]; save();
    toast(S.tracked[this.id]?`Tracking ${MATERIALS[this.id].name} — it will glow in the constellation`:'Tracking removed');
    $('#act-track').classList.toggle('primary',!!S.tracked[this.id]); });
  $('#act-datasheet').addEventListener('click',()=>this.datasheet());
},
scan(){ if(this._scanning) return; const id=this.id,m=MATERIALS[id]; this._scanning=true;
  const ov=$('#scan-progress'),arc=$('#scan-arc'),pct=$('#scan-pct'); ov.classList.add('on');
  let p=0; const iv=setInterval(()=>{ p+=2+Math.random()*2.4;
    if(p>=100){ p=100; clearInterval(iv); setTimeout(()=>{ ov.classList.remove('on'); this._scanning=false;
      S.scans++; const first=!S.discovered[id];
      discover(id,'structural scan'); S.msteps=S.msteps||{};S.msteps[id]=S.msteps[id]||{};S.msteps[id].scan=1;addMastery(id,120); if(!first) addXP(30,'· rescan calibration');
      logEntry(`Structural scan complete — ${m.name}. New structural relationship mapped.`);
      checkAchievements(); this.refreshPanels(); Constellation.pulse(id); },260); }
    arc.style.strokeDashoffset=276.5*(1-p/100); pct.textContent=Math.floor(p)+'%';
    if(Math.floor(p)%9===0) Sound.scan(p/100); },40); },
setState(kind,message=''){const el=$('#codex-viewer-state');if(!el)return;el.className=kind;
  el.innerHTML=kind==='ready'?'':`<span>${message}</span>${kind==='error'?'<button class="ctl sm" data-codex-retry>Retry structure</button>':''}`;},
fail(id,error,token=this.mountToken){if(token!==this.mountToken)return;this.failedId=id;this.renderFailed=true;console.error('Material structure viewer failed',error);
  this.setState('error','The structure could not be rendered. The previous model has been preserved.');},
show(id){ const token=++this.mountToken,m=MATERIALS[id];if(!m)return;
  this.failedId=null;this.renderFailed=false;this.setState('loading',`Loading ${m.name} structure…`);
  S.recentViewed=[id,...S.recentViewed.filter(x=>x!==id)].slice(0,6); save();
  if(window.Quests&&Quests.event) Quests.event('view-material',{id});
  if(this.st){ let bs;try{bs=buildStructure(id);}catch(error){this.fail(id,error,token);return;}
    if(token!==this.mountToken){disposeStructureGroup(bs&&bs.group);return;}
    const previous=this.spec;this.id=id;this.structure=bs;this.spec=bs.group;this.specAnim=bs.anim||null;this.st.scene.add(this.spec);this.zoom=7.4;
    if(previous){this.st.scene.remove(previous);disposeStructureGroup(previous);}
    const cellBtn=$('[data-stg="unit cell"]');if(cellBtn){cellBtn.style.display=bs.cell?'':'none';cellBtn.classList.toggle('on',!!bs.cell);bs.setCell(!!bs.cell);}
    const bondBtn=$('[data-stg="bonds"]'),hasBonds=!!(bs.bonds&&bs.bonds.children.length);if(bondBtn){bondBtn.style.display=hasBonds?'':'none';bondBtn.classList.toggle('on',hasBonds);bs.setBonds(hasBonds);}
    this.setState('ready');
  } else this.id=id;
  $('#view-modes').style.display='none';const stgEl=$('#struct-toggles');if(stgEl)stgEl.style.display='flex';
  const sd=STRUCTURE_DATA[id];$('#structure-badge').textContent=`${sd.structureType} · ${sd.exact?'crystallographic':'representative model'}`;
  $('#structure-legend').innerHTML=(this.structure?this.structure.legend:[]).map(e=>`<span class="structure-key" title="${e.role}"><i style="background:${e.color}"></i><b>${e.symbol}</b>${e.name}</span>`).join('')||'<span class="structure-key">Structure data unavailable</span>';
  this.refreshPanels(); },
refreshPanels(){ const m=MATERIALS[this.id]; const disc=!!S.discovered[this.id];
  $('#cx-name').textContent=m.name.toUpperCase();
  $('#specimen-title').dataset.stack = (m.name.length<=9 && innerWidth>1180) ? '1' : '0';
  $('#cx-id').textContent=m.code; $('#cx-formula').textContent=m.formula;
  $('#cx-family').textContent=FAMILIES[m.family].name;
  const rr=$('#cx-rarity'); rr.textContent=m.rarity; rr.className='rarity '+m.rarity;
  const ml=masteryLevel(this.id);
  $('#cx-mastery-lv').textContent=`Lv. ${ml.lv} — ${MASTERY_NAMES[ml.lv]}`;
  $('#cx-mastery-xp').textContent=ml.maxed?'Complete':`${ml.xp} / ${MASTERY_XP_PER_LEVEL} XP`;
  $('#cx-mastery-bar').style.width=ml.pct+'%';
  const progress=materialProgress(this.id),discPct=progress.pct;
  $('#cx-disc-pct').textContent=discPct+'%';
  $('#cx-disc-lbl').textContent=discPct>=100?'All mastery milestones complete':disc?`${progress.done} of ${progress.total} mastery milestones`:'Not yet discovered';
  $('#cx-diamonds').innerHTML=Array.from({length:8},(_,i)=>`<i class="${i<Math.round(discPct/12.5)?'f':''}"></i>`).join('');
  $('#cx-summary').textContent= disc? m.desc : m.summary+' — scan to resolve the full entry.';
  const stx=typeof STRUCTS!=='undefined'?STRUCTS[this.id]:null;
  $('#cx-bonding').innerHTML=`
    <div class="kv"><span>Hybridisation</span><b>${m.bonding.hybrid}</b></div>
    <div class="kv"><span>Structure</span><b style="max-width:60%">${m.bonding.structure}</b></div>
    <p class="tiny dim" style="margin-top:10px;line-height:1.6">${m.bonding.note}</p>`+
    (stx?`<div class="divider"></div>
    <div class="eyebrow" style="margin-bottom:6px">Structure model shown</div>
    <p style="font-size:11.5px;line-height:1.6;color:var(--pearl-dim)">${stx.repr}</p>
    <div class="kv"><span>Model status</span><b>${stx.exact?'Crystallographic':'Representative'}</b></div>
    <div class="kv"><span>Composition shown</span><b style="max-width:62%;text-align:right;font-size:10.5px">${stx.composition}</b></div>
    <div class="kv"><span>Phase</span><b style="max-width:62%;text-align:right;font-size:10.5px">${stx.phase}</b></div>
    <div class="kv"><span>Scale</span><b>${stx.scale}</b></div>
    <p class="tiny dim" style="margin-top:8px;line-height:1.55">${stx.caveat}<br><b>Source:</b> <a href="${stx.sourceUrl}" target="_blank" rel="noopener">${stx.source}</a></p>`:'');
  $('#cx-synth').innerHTML=m.synth.map(s=>`<div style="padding:8px 0;border-bottom:1px solid rgba(246,242,234,.05)">
    <b style="font-size:11px;letter-spacing:.14em;text-transform:uppercase">${s.n}</b>
    <p class="tiny dim" style="margin-top:4px;line-height:1.55">${s.d}</p></div>`).join('');
  const icoMap={str:'M6 12h12M6 12l3-3M6 12l3 3M18 12l-3-3M18 12l-3 3',ele:'M13 3L5 13h5l-1 8 8-10h-5z',
    den:'M12 3l7 4v10l-7 4-7-4V7z',thm:'M12 4v10M12 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 7h6',opt:'M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0'};
  $('#cx-props').innerHTML=m.props.map(p=>`
    <div class="kv" title="${p.note?esc(p.note)+' · ':''}${p.kind==='lit'?'representative literature range':p.kind==='calc'?'calculated estimate':'gameplay abstraction'}">
      <span style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:var(--lilac);fill:none;stroke-width:1.3"><path d="${icoMap[p.icon]||icoMap.den}"/></svg>${p.k}</span>
      <b>${p.v} <small class="dim">${p.u}</small></b></div>`).join('')
    +`<p class="tiny dim" style="margin-top:10px">Hover a value for provenance. Ranges are representative; processing decides.</p>`;
  drawRadar($('#cx-radar'),[{radar:m.radar,color:m.color,label:m.name}]);
  const appIco='M12 3l2 5.5L20 10l-5 3 1.5 6L12 15.5 7.5 19 9 13 4 10l6-1.5z';
  $('#cx-apps').innerHTML=m.apps.map(a=>`<div class="app-glyph"><svg viewBox="0 0 24 24"><path d="${appIco}"/></svg><span>${a}</span></div>`).join('');
  $('#cx-related').innerHTML=m.related.map(rid=>{ const rmm=MATERIALS[rid]; if(!rmm) return '';
    const known=S.discovered[rid];
    return `<div class="rel-card" data-rel="${rid}"><div class="sw" style="background:radial-gradient(circle at 35% 30%,#fff4,${rmm.color} 42%,#0008 130%);box-shadow:0 0 16px ${rmm.color}55,inset 0 2px 4px rgba(255,255,255,.3),inset 0 -4px 8px rgba(0,0,0,.5)"></div>
      <span>${known?rmm.name:'???'}</span><small class="mono dim" style="font-size:8px">${rmm.code}</small></div>`; }).join('');
  $$('#cx-related .rel-card').forEach(c=>c.addEventListener('click',()=>{ this.show(c.dataset.rel); Sound.click(); }));
  $('#act-track').classList.toggle('primary',!!S.tracked[this.id]);
  const mp=$('#cx-mpath');
  if(mp&&window.Quests){ mp.innerHTML=Quests.masteryPathHTML(this.id); Quests.wireMasteryPath(this.id); }
},
datasheet(){ const m=MATERIALS[this.id]; const disc=S.discovered[this.id];
  if(window.Quests&&Quests.event) Quests.event('datasheet',{id:this.id});
  openModal(`<div class="panel-title">Datasheet — ${m.name}</div><div class="panel-body">
    <div class="row" style="gap:14px;margin-bottom:8px"><span class="mono tiny dim">${m.code}</span>
      <span class="rarity ${m.rarity}">${m.rarity}</span><span class="eyebrow">${FAMILIES[m.family].name} · ${m.cls}</span></div>
    <h2 class="display" style="font-size:42px">${m.name} <span class="dim" style="font-size:20px">${m.formula}</span></h2>
    <div class="divider"></div>
    <p style="font-size:13px;line-height:1.75;color:var(--pearl-dim)">${disc?m.desc:m.summary+' Scan this material to unlock the complete scientific entry.'}</p>
    <div class="divider"></div>
    <div class="grid2">
      <div><div class="eyebrow" style="margin-bottom:8px">Properties</div>
        ${m.props.map(p=>`<div class="kv"><span>${p.k}${p.kind!=='lit'?' <i class="tiny dim">('+p.kind+')</i>':''}</span><b>${p.v} ${p.u}</b></div>`).join('')}
        <p class="tiny dim" style="margin-top:8px">Values are representative literature ranges unless flagged. They vary with processing, purity, orientation, temperature and test method.</p></div>
      <div><div class="eyebrow" style="margin-bottom:8px">Limitations</div>
        ${m.limitations.map(l=>`<div class="kv"><span style="color:var(--pearl-dim)">${l}</span></div>`).join('')}
        <div class="eyebrow" style="margin:14px 0 8px">Lore</div>
        <p class="tiny" style="line-height:1.7;color:var(--lilac);font-style:italic">${disc?m.lore:'— entry sealed until scanned —'}</p></div>
    </div>
    <div class="divider"></div>
    <div class="eyebrow" style="margin-bottom:8px">Sources & references</div>
    ${m.refs.map(r=>`<p class="tiny dim" style="padding:3px 0">· ${r}</p>`).join('')}
  </div>`); },
fallback2D(){ const cv=this.cv,ctx=cv.getContext('2d');
  const draw=()=>{ const w=this.stage.clientWidth,h=this.stage.clientHeight; cv.width=w;cv.height=h;
    ctx.clearRect(0,0,w,h); ctx.strokeStyle='rgba(205,188,247,.5)'; ctx.lineWidth=1;
    const a=22; for(let r=0;r<12;r++)for(let c=0;c<16;c++){ const x=60+c*a*1.5+(r%2?a*.75:0),y=120+r*a*.87;
      ctx.beginPath(); for(let k=0;k<6;k++){ const an=k*Math.PI/3+Math.PI/6;
        ctx[k?'lineTo':'moveTo'](x+Math.cos(an)*a*.55,y+Math.sin(an)*a*.55);} ctx.closePath(); ctx.stroke(); }
    ctx.fillStyle='rgba(246,242,234,.65)'; ctx.font='11px monospace';
    ctx.fillText('WebGL unavailable — static lattice view',20,h-20); };
  draw(); window.addEventListener('resize',draw); } };

/* ---------- radar chart (shared) ---------- */
function drawRadar(cv,entries,axes){
  axes=axes||[['strength','Strength'],['conductivity','Conductivity'],['flexibility','Flexibility'],
    ['stability','Stability'],['sustainability','Sustainability'],['affordability','Cost ▽']];
  const ctx=cv.getContext('2d'); const w=cv.clientWidth||300,h=cv.clientHeight||260;
  cv.width=w*PR; cv.height=h*PR; ctx.scale(PR,PR);
  const cx=w/2,cy=h/2+4,R=Math.min(w,h)/2-34;
  ctx.clearRect(0,0,w,h);
  for(let ring=1;ring<=4;ring++){ ctx.beginPath();
    for(let i=0;i<=axes.length;i++){ const a=-Math.PI/2+i*2*Math.PI/axes.length;
      const r=R*ring/4; ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r); }
    ctx.strokeStyle=`rgba(246,242,234,${ring===4?.2:.07})`; ctx.stroke(); }
  axes.forEach((ax,i)=>{ const a=-Math.PI/2+i*2*Math.PI/axes.length;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);
    ctx.strokeStyle='rgba(246,242,234,.08)'; ctx.stroke();
    ctx.fillStyle='rgba(163,156,141,.9)'; ctx.font='8.5px "Archivo Narrow"'; ctx.textAlign='center';
    ctx.fillText(ax[1].toUpperCase(),cx+Math.cos(a)*(R+18),cy+Math.sin(a)*(R+18)+3); });
  entries.forEach(e=>{ ctx.beginPath();
    axes.forEach((ax,i)=>{ const a=-Math.PI/2+i*2*Math.PI/axes.length;
      const v=clamp((e.radar[ax[0]]||0)/10,0,1);
      ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v); });
    ctx.closePath();
    ctx.fillStyle=e.color+'2b'; ctx.fill();
    ctx.strokeStyle=e.color; ctx.lineWidth=1.4; ctx.shadowColor=e.color; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0; });
}
SCREEN_HOOKS.codex={enter(){ if(Codex.id) Codex.refreshPanels(); }};
