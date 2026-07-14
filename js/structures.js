'use strict';
/* Shared, data-driven scientific structure renderer. No material-specific visual
   fallback is permitted: unavailable data is labelled instead. */
const STRUCTS=Object.fromEntries(Object.entries(STRUCTURE_DATA).map(([id,s])=>[id,{
  repr:s.structureType,representation:s.representation,scale:s.representation==='representative microstructure'?'microstructure':'atomic / molecular',
  phase:s.phase,composition:s.composition,source:s.source.citation,sourceUrl:s.source.url,
  caveat:s.modellingNotes,exact:s.exact,limitations:s.limitations||[]
}]));

const srng=(seed)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const v3=(a)=>new THREE.Vector3(a[0],a[1],a[2]);
const cart=(f,L)=>new THREE.Vector3(
  f[0]*L[0][0]+f[1]*L[1][0]+f[2]*L[2][0],
  f[0]*L[0][1]+f[1]*L[1][1]+f[2]*L[2][1],
  f[0]*L[0][2]+f[1]*L[1][2]+f[2]*L[2][2]);
const bondMesh=(a,b,color='#8e96a8',radius=.035,opacity=.78)=>{
  const d=b.clone().sub(a),len=d.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,len,7),new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.05,transparent:opacity<1,opacity}));
  m.position.copy(a).addScaledVector(d,.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); m.userData.isBond=true; return m;
};
const phaseMaterial=(color,opacity=.34)=>new THREE.MeshStandardMaterial({color,roughness:.8,metalness:0,envMapIntensity:0,toneMapped:false,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});
const atomMaterial=(symbol)=>new THREE.MeshStandardMaterial({color:ELEMENTS[symbol].color,roughness:.72,metalness:0,envMapIntensity:0,toneMapped:false,emissive:0x000000});
const addAtoms=(root,records,pickables)=>{
  const grouped={}; records.forEach((r,i)=>{ r.index=i;(grouped[r.element]||(grouped[r.element]=[])).push(r); });
  Object.entries(grouped).forEach(([symbol,list])=>{
    const e=ELEMENTS[symbol],radius=.09+.045*Math.min(1.7,e.radius); const mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(radius,18,14),atomMaterial(symbol),list.length);
    const mat=new THREE.Matrix4(); list.forEach((r,i)=>{ mat.makeTranslation(r.position.x,r.position.y,r.position.z); mesh.setMatrixAt(i,mat); });
    mesh.instanceMatrix.needsUpdate=true; mesh.userData.atomInstances=list; mesh.userData.element=symbol; mesh.userData.isAtoms=true; root.add(mesh); pickables.push(mesh);
  });
};
const addCell=(root,L,repeat,twoD=false)=>{
  const A=v3(L[0]).multiplyScalar(repeat[0]),B=v3(L[1]).multiplyScalar(repeat[1]),C=twoD?new THREE.Vector3():v3(L[2]).multiplyScalar(repeat[2]),O=new THREE.Vector3();
  const p=[O,A,B,C,A.clone().add(B),A.clone().add(C),B.clone().add(C),A.clone().add(B).add(C)];
  const edges=[[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]];
  const cell=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edges.flatMap(e=>[p[e[0]],p[e[1]]])),new THREE.LineBasicMaterial({color:0xe0c97a,transparent:true,opacity:.78}));
  cell.userData.isUnitCell=true; root.add(cell); return cell;
};
const centerAndScale=(root,target=4.2)=>{ const box=new THREE.Box3().setFromObject(root); if(!box.isEmpty()){ const c=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),s=target/Math.max(size.x,size.y,size.z,1); root.children.forEach(ch=>ch.position.sub(c)); root.scale.setScalar(s); } return root; };
const makeLabel=(text,color='#f3e8c7')=>{ const c=document.createElement('canvas');c.width=512;c.height=72;const x=c.getContext('2d');x.font='600 27px Arial';x.fillStyle=color;x.fillText(text,8,43);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(3.4,.48,1);sp.userData.isStructureLabel=true;return sp; };

function yszRecords(){
  const cations=[[0,0,0],[0,.5,.5],[.5,0,.5],[.5,.5,0]], anions=[];
  [.25,.75].forEach(x=>[.25,.75].forEach(y=>[.25,.75].forEach(z=>anions.push([x,y,z]))));
  const out=[];let ci=0,oi=0;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
    cations.forEach(f=>{const useY=[1,6,12,17,23,28].includes(ci++);out.push({element:useY?'Y':'Zr',fractional:[(f[0]+x)/2,(f[1]+y)/2,(f[2]+z)/2],role:useY?'Y substitution on Zr site':'Zr cation',occupancy:1});});
    anions.forEach(f=>{if(![4,31,52].includes(oi))out.push({element:'O',fractional:[(f[0]+x)/2,(f[1]+y)/2,(f[2]+z)/2],role:'oxide ion',occupancy:1});oi++;});
  } return out;
}
function crystalModel(s){
  const root=new THREE.Group(),pickables=[],L=s.lattice.vectors,repeat=s.id==='zirconia'?[1,1,1]:(s.repeat||[2,2,2]); let basis=s.id==='zirconia'?yszRecords():s.atoms;
  const records=[];
  for(let x=0;x<repeat[0];x++)for(let y=0;y<repeat[1];y++)for(let z=0;z<repeat[2];z++)basis.forEach(a=>{
    const f=a.fractional; let el=a.element;
    if(s.model&&s.model.kind==='substitute'){const n=records.length;const subs=Object.fromEntries(s.model.substitutions.flatMap(([e,count])=>Array.from({length:count},(_,k)=>[(k*7+count*3)%27,e])));el=subs[n]||el;}
    records.push({element:el,role:a.role,occupancy:a.occupancy??1,position:cart([f[0]+x,f[1]+y,f[2]+z],L)});
  });
  addAtoms(root,records,pickables); const bonds=new THREE.Group(); bonds.userData.isBondLayer=true;
  (s.bondRules||[]).forEach(rule=>{ const indices=records.map((r,i)=>[r,i]).filter(([r])=>rule.pair.includes(r.element)); const count=new Array(records.length).fill(0);
    for(let a=0;a<indices.length;a++)for(let b=a+1;b<indices.length;b++){const [ra,ia]=indices[a],[rb,ib]=indices[b];if(!((ra.element===rule.pair[0]&&rb.element===rule.pair[1])||(ra.element===rule.pair[1]&&rb.element===rule.pair[0])))continue;const d=ra.position.distanceTo(rb.position);if(d>=rule.min&&d<=rule.max&&count[ia]<(rule.coordination||99)&&count[ib]<(rule.coordination||99)){bonds.add(bondMesh(ra.position,rb.position));count[ia]++;count[ib]++;}}
  }); root.add(bonds); const cell=addCell(root,L,repeat,s.representation==='layered structure'); const label=makeLabel(s.structureType);label.position.set(0,-2.3,0);root.add(label);centerAndScale(root);
  return {group:root,pickables,cell,bonds,labels:[label],records};
}
function nanotube(s,root,records,bonds){const n=s.model.n,rows=s.model.rows,a=.42,R=n*a*Math.sqrt(3)/(2*Math.PI);for(let r=0;r<rows;r++)for(let k=0;k<2*n;k++){const th=(k+(r%2)*.5)*Math.PI/n;records.push({element:'C',role:'sp² carbon in (10,0) wall',occupancy:1,position:new THREE.Vector3(R*Math.cos(th),(r-(rows-1)/2)*a*.75,R*Math.sin(th))});}for(let i=0;i<records.length;i++){const candidates=[];for(let j=i+1;j<records.length;j++){const d=records[i].position.distanceTo(records[j].position);if(d<.53)candidates.push([d,j]);}candidates.sort((a,b)=>a[0]-b[0]).slice(0,3).forEach(([,j])=>bonds.add(bondMesh(records[i].position,records[j].position,'#7f8794',.025)));}}
function polymer(s,root,records,bonds){const seq=s.model.sequence,chains=s.model.chains||3;for(let c=0;c<chains;c++){for(let k=0;k<16;k++){const el=seq[k%seq.length],p=new THREE.Vector3((k-7.5)*.27,(c-(chains-1)/2)*.55+Math.sin(k*.9+c)*.06,Math.cos(k*.7+c)*.13);const rec={element:el,role:`${s.structureType} backbone`,occupancy:1,position:p};records.push(rec);if(k){const prev=records[records.length-2];bonds.add(bondMesh(prev.position,p,'#8b8296',.026));}}}if(s.model.lamella){const slab=new THREE.Mesh(new THREE.BoxGeometry(2.1,.75,.8),phaseMaterial('#7c6fa5',.13));slab.position.set(-.65,-.75,0);slab.userData.phase='ordered lamella';root.add(slab);}}
function representativeModel(s){
 const root=new THREE.Group(),pickables=[],records=[],bonds=new THREE.Group();bonds.userData.isBondLayer=true;root.add(bonds);const rnd=srng([...s.id].reduce((a,c)=>a+c.charCodeAt(0),17));const kind=s.model.kind;
 if(kind==='nanotube')nanotube(s,root,records,bonds);
 else if(kind==='polymer')polymer(s,root,records,bonds);
 else if(kind==='liquid'){Object.entries(s.model.counts).forEach(([el,n])=>{for(let i=0;i<n;i++){const p=new THREE.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize().multiplyScalar(.25+1.45*Math.cbrt(rnd()));records.push({element:el,role:'liquid constituent; transient local environment',occupancy:1,position:p});}});}
 else if(kind==='glass'){for(let i=0;i<14;i++){const a=i*2.399,p=new THREE.Vector3(Math.cos(a)*(1+i%3*.23),(i%5-2)*.36,Math.sin(a)*(1+i%3*.23));records.push({element:'Si',role:'network former',occupancy:1,position:p});if(i){const prev=records.filter(r=>r.element==='Si').slice(-2)[0],mid=prev.position.clone().lerp(p,.5);records.push({element:'O',role:'bridging oxygen',occupancy:1,position:mid});bonds.add(bondMesh(prev.position,mid,'#9a8590',.024));bonds.add(bondMesh(mid,p,'#9a8590',.024));}}for(let i=0;i<6;i++)records.push({element:i<4?'Na':'Ca',role:'network modifier',occupancy:1,position:new THREE.Vector3((rnd()-.5)*2.5,(rnd()-.5)*1.7,(rnd()-.5)*2.5)});}
 else if(kind==='aerogel'){for(let arm=0;arm<7;arm++){let prev=null;for(let i=0;i<9;i++){const a=arm*.9+i*.28,p=new THREE.Vector3(Math.cos(a)*(i*.16),i*.13-1.1,Math.sin(a)*(i*.16));const si={element:'Si',role:'amorphous silica cluster',occupancy:1,position:p};records.push(si);if(prev){const o={element:'O',role:'siloxane bridge',occupancy:1,position:prev.position.clone().lerp(p,.5)};records.push(o);bonds.add(bondMesh(prev.position,o.position,'#8795a0',.023));bonds.add(bondMesh(o.position,p,'#8795a0',.023));}prev=si;}}}
 else if(kind==='twophase'){for(let phase=0;phase<2;phase++)for(let i=0;i<22;i++){const el=i%13===0?(phase?'V':'Al'):'Ti';records.push({element:el,role:phase?'β-phase grain':'α-phase grain',occupancy:1,position:new THREE.Vector3((phase?1:-1)+((i*7)%5)*.24-.48,((i*3)%7)*.24-.72,((i*11)%5)*.24-.48)});}const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.3),phaseMaterial('#d4b56d',.16));plane.rotation.y=Math.PI/2;plane.userData.phase='α/β boundary';root.add(plane);}
 else if(kind==='precipitate'){for(let i=0;i<55;i++)records.push({element:'Al',role:'FCC Al matrix',occupancy:1,position:new THREE.Vector3(((i*7)%5)*.46-1,((i*3)%5)*.46-1,((i*11)%5)*.46-1)});for(let i=0;i<15;i++)records.push({element:['Al','Cu','Li'][i%3],role:'representative T1 platelet constituent',occupancy:1,position:new THREE.Vector3((i%5)*.38-.76,0,(Math.floor(i/5)-1)*.38)});}
 else if(kind==='fibres'){const fibre=s.phases[0],matrixPhase=s.phases[1];for(let layer=0;layer<2;layer++)for(let i=0;i<10;i++){const geo=new THREE.CylinderGeometry(.09,.09,3.4,12),m=new THREE.Mesh(geo,phaseMaterial(fibre.color,.95));m.rotation.z=layer?Math.PI/2:0;m.position.set(layer?(i-4.5)*.28:0,layer?.45:-.45,layer?0:(i-4.5)*.28);m.userData.phase=fibre.name;root.add(m);}const matrix=new THREE.Mesh(new THREE.BoxGeometry(3.8,1.5,3.1),phaseMaterial(matrixPhase.color,.15));matrix.userData.phase=matrixPhase.name;root.add(matrix);}
 else if(kind==='hydrogel'){for(let c=0;c<5;c++){let prev=null;for(let i=0;i<10;i++){const p=new THREE.Vector3((i-4.5)*.3,(c-2)*.45+Math.sin(i+c)*.12,Math.cos(i*.8+c)*.4),r={element:i%4?'C':'O',role:'crosslinked polymer network',occupancy:1,position:p};records.push(r);if(prev)bonds.add(bondMesh(prev.position,p,'#71769c',.025));prev=r;}}for(let i=0;i<30;i++)records.push({element:'O',role:'water molecule marker',occupancy:1,position:new THREE.Vector3((rnd()-.5)*3,(rnd()-.5)*2.2,(rnd()-.5)*1.8)});}
 else if(kind==='mycelium'){const hypha=s.phases[0],substrate=s.phases[1],mat=phaseMaterial(hypha.color,.9);const branch=(a,b,r)=>{const m=bondMesh(a,b,hypha.color,r,.9);m.material=mat;root.add(m);};for(let i=0;i<18;i++){const a=i*.9,p=new THREE.Vector3(0,-1.4,0),q=new THREE.Vector3(Math.cos(a)*(1+i%3*.3),-.7+(i%4)*.45,Math.sin(a)*(1+i%3*.3));branch(p,q,.045);if(i%2===0)branch(q,q.clone().add(new THREE.Vector3(Math.cos(a+.8)*.7,.45,Math.sin(a+.8)*.7)),.03);}for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.15),phaseMaterial(substrate.color,.95));m.position.set((rnd()-.5)*2.8,-1.1+rnd()*.45,(rnd()-.5)*2.8);m.userData.phase=substrate.name;root.add(m);}}
 addAtoms(root,records,pickables);const label=makeLabel(s.structureType);label.position.set(0,-2.0,0);root.add(label);centerAndScale(root);return {group:root,pickables,bonds,cell:null,labels:[label],records};
}

function buildStructure(id){const s=STRUCTURE_DATA[id];if(!s)return unavailableStructure(id,'Structure data unavailable');s.id=id;const r=s.lattice?crystalModel(s):representativeModel(s);r.meta=STRUCTS[id];r.legend=structureLegend(s,r.records);r.setBonds=on=>{if(r.bonds)r.bonds.visible=on;};r.setCell=on=>{if(r.cell)r.cell.visible=on;};r.setLabels=on=>r.labels.forEach(x=>x.visible=on);return r;}
function unavailableStructure(id,message){const g=new THREE.Group(),l=makeLabel(message,'#ef8b82');g.add(l);return{group:g,pickables:[],legend:[],unavailable:true,meta:{repr:'Unavailable',phase:'—',source:'No source'}};}
function structureLegend(s,records){const seen=[];(records||[]).forEach(r=>{if(!seen.includes(r.element))seen.push(r.element);});(s.elements||[]).forEach(e=>{if(!seen.includes(e))seen.push(e);});if(!(records||[]).length&&s.phases)return s.phases.map(p=>({symbol:'',name:p.name,color:p.color,role:'constituent phase'}));return seen.filter(symbol=>ELEMENTS[symbol]).map(symbol=>{const rec=(records||[]).find(r=>r.element===symbol);return{symbol,name:ELEMENTS[symbol].name,color:ELEMENTS[symbol].color,role:rec?rec.role:'implicit in represented composition; not explicitly rendered'};});}

function validateStructureData(db=STRUCTURE_DATA){const results=[];Object.entries(db).forEach(([id,s])=>{const errors=[],warnings=[];const elems=new Set((s.atoms||[]).map(a=>a.element).concat(s.elements||[]));if(!STRUCTURE_TYPES.includes(s.representation))errors.push('unknown representation type');if(!s.structureType)errors.push('unknown structure label');if(!s.source||!s.source.citation||!s.source.url)errors.push('missing structure provenance');if(s.exact===false&&!s.modellingNotes)errors.push('representative model lacks modelling notes');if(s.exact===true&&!s.lattice)errors.push('exact structure lacks lattice');if(s.lattice&&(!Array.isArray(s.lattice.vectors)||s.lattice.vectors.length!==3||s.lattice.vectors.some(v=>v.length!==3||v.some(n=>!Number.isFinite(n)))))errors.push('invalid or incomplete lattice data');if(s.lattice&&(!s.atoms||!s.atoms.length)&&!(s.model&&s.model.kind==='ysz'))errors.push('missing coordinates');if(!elems.size&&!(s.phases&&s.phases.length))errors.push('missing element identities');elems.forEach(e=>{if(!ELEMENTS[e])errors.push('unknown element '+e);});if((s.bondRules||[]).some(b=>!b.pair||b.pair.length!==2||!(b.min>0)||!(b.max>b.min)))errors.push('invalid bond rule');if(s.genericFallback)errors.push('generic fallback structure');const colors=[...elems].filter(e=>ELEMENTS[e]).map(e=>ELEMENTS[e].color);if(elems.size>1&&new Set(colors).size===1)errors.push('multi-element structure has one colour');if(s.exact===true&&['representative model','representative microstructure','atomic network','polymer chain'].includes(s.representation))errors.push('representative structure claimed exact');if(s.exact===false)warnings.push('representative model; see limitations');results.push({id,representation:s.representation,structureType:s.structureType,source:s.source&&s.source.citation,status:errors.length?'FAIL':'PASS',errors,warnings,limitations:s.limitations||[]});});return results;}
function validateStructures(){return validateStructureData();}
function structValidationTable(){const rs=validateStructureData();return `<table><tr><th>Material</th><th>Representation</th><th>Source</th><th>Validation</th></tr>${rs.map(r=>`<tr><td>${r.id}</td><td>${r.structureType}</td><td>${r.source}</td><td>${r.status}</td></tr>`).join('')}</table>`;}
if(typeof module!=='undefined')module.exports={validateStructureData};
