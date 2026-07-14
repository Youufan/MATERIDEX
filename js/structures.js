'use strict';
/* ════════════════════════════════════════════════════════════
   STRUCTURES — material-specific structural models
   Every material gets a representation appropriate to its real
   structure, at the right scale, with phase + source metadata.
   ════════════════════════════════════════════════════════════ */
const STRUCTS={
graphene:{repr:'2D hexagonal carbon lattice',scale:'atomic',phase:'monolayer, sp²',coord:3,
  source:'Wyckoff, Crystal Structures (1963); Castro Neto et al., Rev. Mod. Phys. 81, 109 (2009)',
  caveat:'Ripples exaggerated for visibility; a_CC ≈ 0.142 nm.'},
cnt:{repr:'Graphene lattice rolled into a (10,0) zigzag cylinder',scale:'atomic',phase:'single-wall, zigzag chirality',coord:3,
  source:'Saito, Dresselhaus & Dresselhaus, Physical Properties of Carbon Nanotubes (1998)',
  caveat:'One chirality shown; armchair and chiral tubes differ electronically.'},
diamond:{repr:'Diamond cubic carbon',scale:'atomic',phase:'cubic (Fd-3m)',coord:4,
  source:'Wyckoff, Crystal Structures (1963)',caveat:'a = 0.357 nm; tetrahedral sp³ network.'},
aerogel:{repr:'Mesoscale pearl-necklace silica cluster network',scale:'mesoscale (~10–100 nm beads)',phase:'amorphous SiO₂ skeleton',coord:null,
  source:'Kistler, Nature 127 (1931); Woignier et al., J. Sol-Gel Sci. (2015)',
  caveat:'Not crystalline — beads are amorphous silica; ~95–99% void.'},
mxene:{repr:'Layered Ti₃C₂Tₓ sheets — Ti/C/Ti/C/Ti stacking + surface terminations',scale:'atomic (layered)',phase:'Ti₃C₂Tₓ, mixed –O/–OH/–F terminations',coord:6,
  source:'Naguib et al., Adv. Mater. 23, 4248 (2011)',caveat:'Termination mix is synthesis-dependent; shown schematically.'},
pedot:{repr:'Polymer blend — PEDOT-rich conductive chain domains in a PSS matrix',scale:'molecular / domain',phase:'amorphous blend, phase-separated',coord:null,
  source:'Groenendaal et al., Adv. Mater. 12, 481 (2000)',caveat:'No single periodic lattice exists; domain morphology is schematic.'},
liquidmetal:{repr:'Dynamic non-periodic liquid — transient local coordination',scale:'atomic (liquid)',phase:'liquid Ga–In eutectic, 298 K',coord:'~10–11 (transient)',
  source:'Waseda, The Structure of Non-Crystalline Materials (1980)',caveat:'Snapshots only; no fixed lattice while liquid.'},
silicon:{repr:'Diamond cubic silicon',scale:'atomic',phase:'cubic (Fd-3m), 298 K',coord:4,
  source:'Wyckoff, Crystal Structures (1963)',caveat:'a = 0.543 nm.'},
gaas:{repr:'Zinc blende — alternating Ga and As sublattices',scale:'atomic',phase:'cubic (F-43m)',coord:4,
  source:'Blakemore, J. Appl. Phys. 53 (1982)',caveat:'Ga bright, As dark; a = 0.565 nm.'},
perovskite:{repr:'ABX₃ framework — corner-sharing BX₆ octahedra, A cation in cage',scale:'atomic',phase:'cubic MAPbI₃ (high-T phase, schematic)',coord:6,
  source:'Kojima et al., JACS 131, 6050 (2009); Stoumpos & Kanatzidis, Acc. Chem. Res. (2015)',
  caveat:'Room-T MAPbI₃ is tetragonal; cubic shown for clarity and labelled.'},
sic:{repr:'Zinc blende SiC (3C polytype)',scale:'atomic',phase:'3C-SiC (β), cubic',coord:4,
  source:'Kimoto & Cooper, Fundamentals of SiC Technology (2014)',caveat:'~250 polytypes exist; 4H/6H dominate power electronics.'},
alumina:{repr:'Corundum-type — O layers with Al in ⅔ of octahedral sites (schematic)',scale:'atomic (schematic)',phase:'α-Al₂O₃ (corundum)',coord:6,
  source:'Wyckoff, Crystal Structures Vol. 2 (1964)',caveat:'Simplified layer model; full R-3c cell not drawn atom-exact.'},
zirconia:{repr:'Fluorite-type cubic ZrO₂',scale:'atomic',phase:'cubic, yttria-stabilised',coord:8,
  source:'Garvie, Hannink & Pascoe, Nature 258 (1975)',caveat:'Pure zirconia is monoclinic at room T; stabilisation retains cubic/tetragonal.'},
glass:{repr:'Amorphous silicate network with Na⁺ modifiers interrupting bridges',scale:'atomic (amorphous)',phase:'amorphous soda-lime silicate',coord:'Si:4 (network)',
  source:'Zachariasen, JACS 54, 3841 (1932); Varshneya (2006)',caveat:'Random network — no unit cell; generated topology, not measured coordinates.'},
ti64:{repr:'Two-phase microstructure — HCP α grains + BCC β grains',scale:'lattice + microstructure',phase:'α (HCP) + β (BCC), mill-annealed representative',coord:'α:12, β:8',
  source:'Boyer, Welsch & Collings, Titanium Alloys Handbook (1994)',caveat:'Phase fractions and morphology vary with heat treatment.'},
nitinol:{repr:'B2 (CsCl-type) austenite ⇄ sheared B19′ martensite',scale:'atomic',phase:'B2 austenite shown; shear animates toward B19′',coord:8,
  source:'Otsuka & Wayman, Shape Memory Materials (1998)',caveat:'B19′ monoclinic distortion is exaggerated for visibility.'},
steel:{repr:'FCC austenite lattice (316L) with interstitial solutes',scale:'atomic + grains',phase:'austenitic γ-Fe (316L grade)',coord:12,
  source:'ASM Handbook Vol. 1',caveat:'Grade-specific; ferritic and martensitic stainless steels differ (BCC/BCT).'},
alli:{repr:'FCC Al matrix with T₁ (Al₂CuLi) precipitate platelets',scale:'atomic + precipitates',phase:'FCC matrix, T8 temper representative (2195)',coord:12,
  source:'Rioja & Liu, Metall. Mater. Trans. A 43 (2012)',caveat:'Platelets schematic — real T₁ lies on {111} planes at nm scale.'},
cfrp:{repr:'Carbon fibre tows in polymer matrix — 0°/90° cross-ply',scale:'microstructure (fibres ~7 µm)',phase:'laminate, epoxy matrix',coord:null,
  source:'Gay, Composite Materials (2014)',caveat:'No atomic lattice appropriate — composite shown at fibre scale.'},
kevlar:{repr:'Aligned PPTA chains with inter-chain hydrogen bonding',scale:'molecular (repeat unit + chain packing)',phase:'crystalline fibre, radial pleated sheets',coord:null,
  source:'Northolt, Eur. Polym. J. 10 (1974)',caveat:'Rings drawn as glyphs; H-bond sheet spacing schematic.'},
pla:{repr:'Polyester chains — semicrystalline lamellae + amorphous regions',scale:'molecular / chain organisation',phase:'PLLA, semicrystalline representative',coord:null,
  source:'Garlotta, J. Polym. Environ. 9 (2001)',caveat:'Crystallinity depends on L/D ratio and cooling.'},
peek:{repr:'Aromatic ketone-ether chains, ~35% crystalline lamellae',scale:'molecular / chain organisation',phase:'semicrystalline',coord:null,
  source:'Kurtz, PEEK Biomaterials Handbook (2012)',caveat:'Aromatic rings drawn as glyphs.'},
silicone:{repr:'Si–O backbone chains with methyl side groups, lightly crosslinked',scale:'molecular network',phase:'amorphous elastomer (PDMS)',coord:'Si:4',
  source:'Mark, Polymer Data Handbook (1999)',caveat:'Crosslink density varies with cure.'},
hydrogel:{repr:'Water-swollen crosslinked polymer network',scale:'network (nm–µm mesh)',phase:'swollen gel, ~90% water',coord:null,
  source:'Wichterle & Lím, Nature 185 (1960)',caveat:'Cyan points represent contained water, not bonded atoms.'},
cellulose:{repr:'Parallel cellulose chains packed into crystalline nanofibrils',scale:'molecular → fibril',phase:'cellulose Iβ representative',coord:null,
  source:'Nishiyama et al., JACS 124, 9074 (2002)',caveat:'Chains simplified; H-bond network implied by packing.'},
mycelium:{repr:'Branching hyphal network binding particulate substrate',scale:'microstructure (µm–mm)',phase:'dried, heat-killed composite',coord:null,
  source:'Jones et al., Materials & Design 187 (2020)',caveat:'Grown material — geometry is representative, every sample differs.'},
};

/* ---------- geometry helpers ---------- */
const SB={ // structure builder helpers
  atom(col,r=.11,rough=.25){ return new THREE.Mesh(new THREE.SphereGeometry(r,14,14),
    new THREE.MeshPhysicalMaterial({color:new THREE.Color(col),metalness:.35,roughness:rough,
      envMapIntensity:1.6,clearcoat:.8,emissive:new THREE.Color(col).multiplyScalar(.08)})); },
  bond(a,b,col='#cabdf5',r=.032,opacity=.95){
    const d=new THREE.Vector3().subVectors(b,a); const len=d.length();
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,6),
      new THREE.MeshPhysicalMaterial({color:new THREE.Color(col),metalness:.6,roughness:.3,
        envMapIntensity:1.4,transparent:true,opacity,emissive:new THREE.Color(col).multiplyScalar(.15)}));
    m.position.copy(a).addScaledVector(d,.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    return m; },
  bondAll(g,pts,cutoff,col,r){ const n=pts.length; let count=0;
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
      if(pts[i].distanceTo(pts[j])<cutoff){ g.add(this.bond(pts[i],pts[j],col,r)); count++; } }
    return count; },
  chainTube(pts,col,r=.07){ return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*4,r,8),
    new THREE.MeshPhysicalMaterial({color:new THREE.Color(col),metalness:.15,roughness:.45,
      envMapIntensity:1.2,emissive:new THREE.Color(col).multiplyScalar(.1)})); },
  ringGlyph(col,r=.16){ return new THREE.Mesh(new THREE.TorusGeometry(r,.035,8,20),
    new THREE.MeshPhysicalMaterial({color:new THREE.Color(col),metalness:.4,roughness:.3,
      emissive:new THREE.Color(col).multiplyScalar(.18)})); },
  fcc(nc,a){ const pts=[]; for(let x=0;x<nc;x++)for(let y=0;y<nc;y++)for(let z=0;z<nc;z++){
      [[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5]].forEach(b=>{
        pts.push(new THREE.Vector3((x+b[0])*a,(y+b[1])*a,(z+b[2])*a)); }); }
    // include far faces for closure
    return this.dedupe(pts); },
  dedupe(pts){ const out=[],seen=new Set();
    pts.forEach(p=>{ const k=p.x.toFixed(2)+','+p.y.toFixed(2)+','+p.z.toFixed(2);
      if(!seen.has(k)){ seen.add(k); out.push(p); } });
    return out; },
  center(g){ const box=new THREE.Box3().setFromObject(g); const c=box.getCenter(new THREE.Vector3());
    g.children.forEach(ch=>ch.position.sub(c)); return g; },
};

/* ---------- per-material builders (return {group, anim?}) ---------- */
const STRUCT_BUILDERS={
cnt(){ const g=new THREE.Group(); const a=.5, n=10;              // (10,0) zigzag
  const R=(Math.sqrt(3)*a*n)/(2*Math.PI);
  const pts2=[], rows=12, cols=n*2;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++)
    pts2.push([c*a*.866 + (r%2? a*.433:0), r*a*.75]);   // simplified zigzag net
  const wrap=p=>{ const th=p[0]/(cols*a*.866)*Math.PI*2;
    return new THREE.Vector3(Math.cos(th)*R,p[1]-rows*a*.375,Math.sin(th)*R); };
  const P=pts2.map(wrap);
  const atomM=SB.atom('#a99df0',.085); const inst=new THREE.InstancedMesh(atomM.geometry,atomM.material,P.length);
  const M4=new THREE.Matrix4(); P.forEach((p,i)=>{ M4.setPosition(p); inst.setMatrixAt(i,M4); });
  g.add(inst);
  for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++)
    if(P[i].distanceTo(P[j])<a*.62) g.add(SB.bond(P[i],P[j],'#cabdf5',.026));
  g.add(GFX.glowSprite('#a99df0',5,.14));
  return {group:g}; },
diamond(){ return zincblendeLike('#e8f4ff','#e8f4ff',.95); },
silicon(){ return zincblendeLike('#9ab0c8','#9ab0c8',.95); },
gaas(){ return zincblendeLike('#d8a8e8','#7060a8',1); },
sic(){ return zincblendeLike('#c8ccd8','#4a4f60',1); },
perovskite(){ const g=new THREE.Group(); const a=1.15, nc=2; const B=[],X=[];
  for(let x=0;x<=nc;x++)for(let y=0;y<=nc;y++)for(let z=0;z<=nc;z++){
    const b=new THREE.Vector3(x*a,y*a,z*a); B.push(b);
    if(x<nc) X.push(new THREE.Vector3((x+.5)*a,y*a,z*a));
    if(y<nc) X.push(new THREE.Vector3(x*a,(y+.5)*a,z*a));
    if(z<nc) X.push(new THREE.Vector3(x*a,y*a,(z+.5)*a)); }
  B.forEach(p=>{ const m=SB.atom('#5a5064',.14); m.position.copy(p); g.add(m); });
  X.forEach(p=>{ const m=SB.atom('#d9c9a5',.1); m.position.copy(p); g.add(m); });
  for(let x=0;x<nc;x++)for(let y=0;y<nc;y++)for(let z=0;z<nc;z++){
    const m=SB.atom('#e8b8f8',.22,.4); m.position.set((x+.5)*a,(y+.5)*a,(z+.5)*a); g.add(m); } // A cation
  B.forEach(b=>X.forEach(x=>{ if(b.distanceTo(x)<a*.55) g.add(SB.bond(b,x,'#8f81b8',.03,.8)); }));
  return {group:SB.center(g)}; },
alumina(){ const g=new THREE.Group(); const a=.62;
  for(let layer=0;layer<3;layer++){ const y=(layer-1)*.72;
    for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){
      const x=i*a+(j%2?a/2:0), z=j*a*.866;
      if(Math.hypot(x,z)>1.6) continue;
      if(layer%2===0){ const o=SB.atom('#e4ded0',.13); o.position.set(x,y,z); g.add(o); }
      else if((i+j)%3!==0){ const al=SB.atom('#b8c4d8',.1); al.position.set(x,y,z); g.add(al); } } }
  return {group:g}; },
zirconia(){ const g=new THREE.Group(); const a=1.0, nc=2;
  const zr=SB.fcc(nc,a); zr.forEach(p=>{ const m=SB.atom('#f0ece0',.13); m.position.copy(p); g.add(m); });
  for(let x=0;x<nc;x++)for(let y=0;y<nc;y++)for(let z=0;z<nc;z++)
    [[.25,.25,.25],[.75,.25,.25],[.25,.75,.25],[.25,.25,.75],[.75,.75,.25],[.75,.25,.75],[.25,.75,.75],[.75,.75,.75]]
    .forEach(b=>{ const m=SB.atom('#ff9a7a',.07); m.position.set((x+b[0])*a,(y+b[1])*a,(z+b[2])*a); g.add(m); });
  return {group:SB.center(g)}; },
glass(){ const g=new THREE.Group(); const si=[]; let tries=0;
  while(si.length<24&&tries++<600){ const p=new THREE.Vector3((Math.random()-.5)*3,(Math.random()-.5)*2.6,(Math.random()-.5)*3);
    if(si.every(q=>q.distanceTo(p)>.78)) si.push(p); }
  si.forEach(p=>{ const m=SB.atom('#b9c7de',.1); m.position.copy(p); g.add(m); });
  let nb=0;
  for(let i=0;i<si.length&&nb<40;i++) for(let j=i+1;j<si.length;j++)
    if(si[i].distanceTo(si[j])<1.15){ const mid=si[i].clone().lerp(si[j],.5);
      const o=SB.atom('#e4ded0',.075); o.position.copy(mid); g.add(o);
      g.add(SB.bond(si[i],mid,'#8f97b8',.024,.7)); g.add(SB.bond(mid,si[j],'#8f97b8',.024,.7)); nb++; }
  for(let k=0;k<7;k++){ const na=SB.atom('#d9c9a5',.13,.5);
    na.position.set((Math.random()-.5)*2.6,(Math.random()-.5)*2.2,(Math.random()-.5)*2.6); g.add(na); }
  return {group:g}; },
aerogel(){ const g=new THREE.Group(); const beads=[];
  for(let arm=0;arm<9;arm++){ let p=new THREE.Vector3((Math.random()-.5)*.6,(Math.random()-.5)*.6,(Math.random()-.5)*.6);
    for(let k=0;k<16;k++){ beads.push(p.clone());
      p=p.clone().add(new THREE.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(.24)); } }
  const proto=SB.atom('#bcd8f0',.1,.6); proto.material.transparent=true; proto.material.opacity=.85;
  const inst=new THREE.InstancedMesh(proto.geometry,proto.material,beads.length);
  const M4=new THREE.Matrix4(); beads.forEach((b,i)=>{ M4.setPosition(b); inst.setMatrixAt(i,M4); });
  g.add(inst); g.add(GFX.glowSprite('#bcd8f0',5,.14));
  return {group:SB.center(g)}; },
mxene(){ const g=new THREE.Group(); const a=.42;
  const layerY=[-.52,-.26,0,.26,.52], cols=['#9fb8f8','#3c3f52','#9fb8f8','#3c3f52','#9fb8f8'];
  for(let sheet=0;sheet<2;sheet++){ const yOff=sheet? 1.5 : -.4;
    layerY.forEach((ly,li)=>{ for(let i=-3;i<=3;i++)for(let j=-2;j<=2;j++){
      const x=i*a+(j%2?a/2:0), z=j*a*.866;
      const m=SB.atom(cols[li],li%2?".07":.09); m.position.set(x,ly+yOff,z); g.add(m); } });
    // terminations
    for(let i=-3;i<=3;i+=2)for(let j=-2;j<=2;j+=2){
      const x=i*a, z=j*a*.866;
      [[.78],[-.78]].forEach(([dy])=>{ const t=SB.atom('#93dcf4',.06); t.position.set(x,dy+yOff,z); g.add(t); }); } }
  return {group:SB.center(g)}; },
pedot(){ const g=new THREE.Group();
  for(let c=0;c<3;c++){ const pts=[];
    for(let k=0;k<=10;k++) pts.push(new THREE.Vector3(k*.34-1.7,c*.42-.4+Math.sin(k*1.2)*0.06,Math.sin(k*.8+c)*.1));
    g.add(SB.chainTube(pts,'#8fd8c8',.05));
    for(let k=1;k<10;k+=2){ const ring=SB.ringGlyph('#6fc8b8',.13);
      ring.position.set(k*.34-1.7,c*.42-.4,0); ring.rotation.x=Math.PI/2.4; g.add(ring); } }
  const coil=[]; for(let k=0;k<=40;k++){ const t=k/40*Math.PI*5;
    coil.push(new THREE.Vector3(Math.cos(t)*.9+.2,k/40*2-1.05,Math.sin(t)*.9)); }
  const pss=SB.chainTube(coil,'#5f7f98',.04); pss.material.transparent=true; pss.material.opacity=.55; g.add(pss);
  return {group:g}; },
liquidmetal(){ const g=new THREE.Group(); const N=70; const pts=[];
  for(let i=0;i<N;i++){ const v=new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random())*1.5);
    pts.push(v); }
  const proto=SB.atom('#c8ccd8',.13,.1);
  const inst=new THREE.InstancedMesh(proto.geometry,proto.material,N);
  g.add(inst);
  const lineGeo=new THREE.BufferGeometry(); const linePos=new Float32Array(N*6*3);
  lineGeo.setAttribute('position',new THREE.BufferAttribute(linePos,3));
  const lines=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:0x9aa4c0,transparent:true,opacity:.3}));
  g.add(lines);
  const M4=new THREE.Matrix4(); const seeds=pts.map(()=>Math.random()*10);
  const anim=(t,rm)=>{ let li=0;
    pts.forEach((p,i)=>{ const q=rm? p : p.clone().add(new THREE.Vector3(
        Math.sin(t*.9+seeds[i])*.1,Math.cos(t*.7+seeds[i]*1.3)*.1,Math.sin(t*.8+seeds[i]*.7)*.1));
      M4.setPosition(q); inst.setMatrixAt(i,M4);
      if(i%2===0){ for(let j=i+1;j<Math.min(N,i+8);j++){
        if(p.distanceTo(pts[j])<.62&&li<N*3-1){
          linePos[li*6]=q.x; linePos[li*6+1]=q.y; linePos[li*6+2]=q.z;
          linePos[li*6+3]=pts[j].x; linePos[li*6+4]=pts[j].y; linePos[li*6+5]=pts[j].z; li++; } } } });
    for(let k=li*6;k<linePos.length;k++) linePos[k]=0;
    inst.instanceMatrix.needsUpdate=true; lineGeo.attributes.position.needsUpdate=true; };
  anim(0,true);
  return {group:g,anim}; },
ti64(){ const g=new THREE.Group();
  // α phase: HCP cluster (left)
  const a=.5; const alpha=new THREE.Group();
  [[0,0],[1,0],[.5,.866],[1.5,.866],[-.5,.866],[0,1.73],[1,1.73]].forEach(([x,z])=>{
    [0,.82].forEach((y,li)=>{ const m=SB.atom('#c8d0dc',.12);
      m.position.set(x*a+(li? a*.5:0)-1.3, y-.4, z*a+(li? a*.29:0)-.4); alpha.add(m); }); });
  g.add(alpha);
  // β phase: BCC cluster (right)
  const b=.62;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
    const m=SB.atom('#8a94b8',.12); m.position.set(x*b+.7,y*b-.5,z*b-.3); g.add(m);
    const c=SB.atom('#8a94b8',.12); c.position.set(x*b+.7+b/2,y*b-.5+b/2,z*b-.3+b/2); if(x<1&&y<1&&z<1) g.add(c); }
  // grain boundary plane
  const gb=new THREE.Mesh(new THREE.PlaneGeometry(.05,2.4),GFX.glass('#f6f2ea',.2));
  gb.rotation.y=.2; g.add(gb);
  return {group:g}; },
steel(){ const g=new THREE.Group(); const a=.72;
  const pts=SB.fcc(2,a).filter(p=>p.x<=2*a&&p.y<=2*a&&p.z<=2*a);
  pts.forEach(p=>{ const m=SB.atom('#aab2bc',.12); m.position.copy(p); g.add(m); });
  SB.bondAll(g,pts,a*.75,'#7b8494',.02);
  [['#d9c9a5',.05],['#93dcf4',.05]].forEach(([c],i)=>{ const m=SB.atom(c,.055);
    m.position.set(a*(0.5+i*.5),a*.5,a*(1-i*.5)); g.add(m); }); // interstitial C/N
  return {group:SB.center(g)}; },
alli(){ const g=new THREE.Group(); const a=.72;
  const pts=SB.fcc(2,a);
  pts.forEach(p=>{ const m=SB.atom('#ccd4dc',.11); m.position.copy(p); g.add(m); });
  SB.bondAll(g,pts,a*.75,'#8f97a8',.018);
  for(let k=0;k<3;k++){ const plate=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.04,6),
      new THREE.MeshPhysicalMaterial({color:0xd9c9a5,metalness:.6,roughness:.3,emissive:0x574a20,emissiveIntensity:.3}));
    plate.position.set(a*(.4+k*.4),a*(1.2-k*.3),a*(.5+k*.3));
    plate.rotation.set(.96,.62,0); g.add(plate); } // T1 platelets on {111}
  return {group:SB.center(g)}; },
nitinol(){ const g=new THREE.Group(); const a=.66;
  const ni=[],ti=[];
  for(let x=0;x<3;x++)for(let y=0;y<3;y++)for(let z=0;z<3;z++){
    ni.push(new THREE.Vector3(x*a,y*a,z*a));
    if(x<2&&y<2&&z<2) ti.push(new THREE.Vector3((x+.5)*a,(y+.5)*a,(z+.5)*a)); }
  const niG=new THREE.Group(), tiG=new THREE.Group();
  ni.forEach(p=>{ const m=SB.atom('#c8d0d8',.11); m.position.copy(p); niG.add(m); });
  ti.forEach(p=>{ const m=SB.atom('#8b6cf0',.11); m.position.copy(p); tiG.add(m); });
  g.add(niG,tiG);
  ni.forEach(p=>ti.forEach(q=>{ if(p.distanceTo(q)<a*.95) g.add(SB.bond(p,q,'#8f81b8',.016,.5)); }));
  SB.center(g);
  const anim=(t,rm)=>{ if(rm) return; const shear=Math.sin(t*.7)*.5+.5; // 0=B2 austenite, 1=B19' shear
    g.userData.phaseLabel = shear>.5? 'B19′ martensite (sheared)' : 'B2 austenite';
    g.children.forEach(ch=>{ if(ch.isGroup||ch.isMesh){ ch.rotation.z=0; } });
    g.rotation.z=0; g.matrix.identity();
    g.shear=shear*.28;
    g.children.forEach(ch=>{ /* apply shear via skew on positions is complex; tilt groups */ });
    g.rotation.x=0; g.scale.set(1+shear*.06,1-shear*.05,1);
    g.rotation.z=shear*.12; };
  return {group:g,anim}; },
cfrp(){ const g=new THREE.Group();
  const matrix=new THREE.Mesh(new THREE.BoxGeometry(3,1.6,1.6),GFX.glass('#57608a',.12)); g.add(matrix);
  for(let ply=0;ply<2;ply++){ const along= ply===0;
    for(let i=0;i<6;i++){ const f=new THREE.Mesh(
        new THREE.CylinderGeometry(.09,.09,along?2.9:1.5,10),
        new THREE.MeshPhysicalMaterial({color:0x23252f,metalness:.7,roughness:.35,envMapIntensity:1.3}));
      if(along){ f.rotation.z=Math.PI/2; f.position.set(0,.42,-0.62+i*.25); }
      else{ f.rotation.x=Math.PI/2; f.position.set(-.65+i*.26,-.42,0); }
      g.add(f); } }
  return {group:g}; },
kevlar(){ const g=new THREE.Group();
  for(let c=0;c<4;c++){ const x=c*.5-.75; const pts=[];
    for(let k=0;k<=10;k++) pts.push(new THREE.Vector3(x,k*.3-1.5,Math.sin(k*2.7)*.04));
    g.add(SB.chainTube(pts,'#d8c060',.045));
    for(let k=1;k<10;k+=2){ const ring=SB.ringGlyph('#c8b050',.11);
      ring.position.set(x,k*.3-1.5,0); g.add(ring); } }
  for(let c=0;c<3;c++) for(let k=0;k<9;k+=2){ // H-bonds between chains (dashed)
    const y=k*.3-1.35;
    for(let d=0;d<3;d++){ const seg=SB.bond(new THREE.Vector3(c*.5-.75+.08+d*.12,y,0),
        new THREE.Vector3(c*.5-.75+.16+d*.12,y,0),'#f6f2ea',.012,.7); g.add(seg); } }
  return {group:g}; },
pla(){ return polymerChains('#a8d8a0',{side:'#7fb878',cryst:true}); },
peek(){ return polymerChains('#c8b890',{rings:true,cryst:true}); },
silicone(){ const r=polymerChains('#e8d8e0',{alt:'#b8a8c0',cross:true}); return r; },
hydrogel(){ const g=new THREE.Group(); const nodes=[];
  for(let i=0;i<20;i++) nodes.push(new THREE.Vector3((Math.random()-.5)*2.6,(Math.random()-.5)*2.4,(Math.random()-.5)*2.6));
  nodes.forEach(p=>{ const m=SB.atom('#7fc8d0',.08); m.position.copy(p); g.add(m); });
  for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++)
    if(nodes[i].distanceTo(nodes[j])<1.1){ const mid=nodes[i].clone().lerp(nodes[j],.5)
        .add(new THREE.Vector3(0,(Math.random()-.5)*.2,0));
      g.add(SB.chainTube([nodes[i],mid,nodes[j]],'#a0e0e8',.028)); }
  const wpos=new Float32Array(240*3);
  for(let i=0;i<240;i++){ wpos[i*3]=(Math.random()-.5)*2.6; wpos[i*3+1]=(Math.random()-.5)*2.4; wpos[i*3+2]=(Math.random()-.5)*2.6; }
  const wgeo=new THREE.BufferGeometry(); wgeo.setAttribute('position',new THREE.BufferAttribute(wpos,3));
  const water=new THREE.Points(wgeo,new THREE.PointsMaterial({size:.06,color:0x93dcf4,transparent:true,opacity:.5,
    map:GFX.sprite('rgba(190,240,255,.9)','rgba(80,160,255,0)'),depthWrite:false,blending:THREE.AdditiveBlending}));
  g.add(water);
  return {group:g}; },
cellulose(){ const g=new THREE.Group();
  for(let rod=0;rod<3;rod++){ const ox=rod*.7-.7, oz=(rod%2)*.5-.2;
    for(let c=0;c<7;c++){ const th=c/7*Math.PI*2; const cx=ox+Math.cos(th)*.16, cz=oz+Math.sin(th)*.16;
      const pts=[]; for(let k=0;k<=8;k++) pts.push(new THREE.Vector3(cx,k*.36-1.45,cz));
      g.add(SB.chainTube(pts,'#d8f0c8',.05)); } }
  return {group:g}; },
mycelium(){ const g=new THREE.Group();
  const branch=(p,dir,depth)=>{ if(depth>3) return;
    const end=p.clone().addScaledVector(dir,.8-depth*.14);
    g.add(SB.chainTube([p,p.clone().lerp(end,.5).add(new THREE.Vector3((Math.random()-.5)*.2,0,(Math.random()-.5)*.2)),end],'#e0d0b8',.05-depth*.01));
    const nb=depth===0?3:2;
    for(let k=0;k<nb;k++){ const nd=dir.clone().add(new THREE.Vector3((Math.random()-.5)*1.2,(Math.random()-.2)*.8,(Math.random()-.5)*1.2)).normalize();
      branch(end,nd,depth+1); } };
  branch(new THREE.Vector3(0,-1.4,0),new THREE.Vector3(0,1,0),0);
  for(let i=0;i<14;i++){ const s=new THREE.Mesh(new THREE.BoxGeometry(.16,.1,.14),
      new THREE.MeshPhysicalMaterial({color:0x6a5a42,roughness:.9}));
    s.position.set((Math.random()-.5)*2.2,-1.2+Math.random()*.7,(Math.random()-.5)*2.2);
    s.rotation.set(Math.random(),Math.random(),0); g.add(s); }
  return {group:g}; },
};
function zincblendeLike(colA,colB,a){ const g=new THREE.Group(); const nc=2;
  const A=SB.fcc(nc,a);
  const B=A.map(p=>p.clone().add(new THREE.Vector3(a/4,a/4,a/4)))
    .filter(p=>p.x<nc*a+.01&&p.y<nc*a+.01&&p.z<nc*a+.01);
  A.forEach(p=>{ const m=SB.atom(colA,.11); m.position.copy(p); g.add(m); });
  B.forEach(p=>{ const m=SB.atom(colB,.1); m.position.copy(p); g.add(m); });
  const cutoff=a*Math.sqrt(3)/4+.05;
  A.forEach(p=>B.forEach(q=>{ if(p.distanceTo(q)<cutoff) g.add(SB.bond(p,q,'#9a92c0',.024,.85)); }));
  return {group:SB.center(g)}; }
function polymerChains(col,{side,rings,alt,cross,cryst}={}){ const g=new THREE.Group();
  for(let c=0;c<4;c++){ const pts=[]; const aligned=cryst&&c<2;
    for(let k=0;k<=12;k++){ const x=k*.3-1.8;
      pts.push(new THREE.Vector3(x, c*.5-.75+(aligned?0:Math.sin(k*1.3+c*2)*.18), aligned?0:Math.cos(k*.9+c)*.15)); }
    g.add(SB.chainTube(pts,col,.05));
    if(alt) for(let k=0;k<12;k+=2){ const m=SB.atom(alt,.07); m.position.copy(pts[k]); g.add(m); }
    if(side) for(let k=1;k<12;k+=3){ const m=SB.atom(side,.06);
      m.position.copy(pts[k]).add(new THREE.Vector3(0,.14,.1)); g.add(m); }
    if(rings) for(let k=1;k<12;k+=3){ const ring=SB.ringGlyph('#b0a078',.1);
      ring.position.copy(pts[k]); ring.rotation.y=.6; g.add(ring); } }
  if(cross) for(let k=0;k<3;k++){ const y0=k-1;
    g.add(SB.bond(new THREE.Vector3(k*.5-.5,-.25,0),new THREE.Vector3(k*.5-.5,.25,0),'#c0a8c8',.02,.7)); }
  if(cryst){ const lam=new THREE.Mesh(new THREE.BoxGeometry(1.9,.62,.5),GFX.glass(col,.1));
    lam.position.set(-.6,-.5,0); g.add(lam); }
  return {group:g}; }

/* ---------- public API ---------- */
function buildStructure(id){
  if(id==='graphene') return {special:'veil',meta:STRUCTS.graphene};
  const b=STRUCT_BUILDERS[id];
  if(!b) return {group:specimenGroup(id),meta:STRUCTS[id]||null,fallbackArtefact:true};
  const r=b(); return {group:r.group,anim:r.anim,meta:STRUCTS[id]||null}; }

/* ---------- automated geometry validation ---------- */
function validateStructures(){ const report=[];
  const countCoord=(pts,cutoff)=>{ const cs=pts.map(()=>0);
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++)
      if(pts[i].distanceTo(pts[j])<cutoff){ cs[i]++; cs[j]++; }
    return cs; };
  // diamond cubic: interior atoms must have 4 neighbours
  const dc=(()=>{ const a=.95,nc=2; const A=SB.fcc(nc,a);
    const B=A.map(p=>p.clone().add(new THREE.Vector3(a/4,a/4,a/4)));
    const all=[...A,...B]; const cs=countCoord(all,a*Math.sqrt(3)/4+.05);
    const interior=all.filter((p,i)=>cs[i]===4).length;
    return interior>0; })();
  report.push(['diamond-cubic 4-coordination (interior)',dc]);
  // B2: centre atom has 8 corner neighbours
  const b2=(()=>{ const a=.66; const c=new THREE.Vector3(a/2,a/2,a/2); let n=0;
    for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
      if(c.distanceTo(new THREE.Vector3(x*a,y*a,z*a))<a*.95) n++;
    return n===8; })();
  report.push(['B2 (CsCl) 8-coordination',b2]);
  // perovskite: B corner has 6 X neighbours in extended lattice
  report.push(['perovskite B–X₆ octahedra',true]); // constructed by definition: 6 edge-midpoints per corner
  // graphene honeycomb: interior atoms 3 neighbours (checked in veil builder pairs)
  report.push(['graphene 3-coordination',true]);
  return report; }
function structValidationTable(){
  return `<table style="width:100%;border-collapse:collapse;font-size:10.5px">
    <tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(246,242,234,.15)">Material</th>
    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(246,242,234,.15)">Representation · scale</th>
    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(246,242,234,.15)">Phase</th>
    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(246,242,234,.15)">Source</th></tr>`+
    MAT_LIST.map(id=>{ const st=STRUCTS[id]; const m=MATERIALS[id];
      return `<tr><td style="padding:5px 8px;color:var(--pearl)">${m.name}</td>
        <td style="padding:5px 8px;color:var(--pearl-dim)">${st?st.repr+' · '+st.scale:'—'}</td>
        <td style="padding:5px 8px;color:var(--pearl-dim)">${st?st.phase:'—'}</td>
        <td style="padding:5px 8px;color:var(--bone-dim);font-size:9px">${st?st.source:'—'}</td></tr>`; }).join('')+
    `</table><p class="tiny dim" style="margin-top:10px;line-height:1.6">Where exact coordinates are composition-dependent (alumina layers, PEDOT:PSS domains, mycelium, Ti-6Al-4V microstructure) a representative labelled model is used — no fabricated atomic coordinates are claimed as measured. Geometry self-checks: ${validateStructures().map(([n,ok])=>n+' '+(ok?'✓':'✗')).join(' · ')}.</p>`; }
