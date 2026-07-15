'use strict';
/* Shared, data-driven scientific structure renderer. No material-specific visual
   fallback is permitted: unavailable data is labelled instead. */
const STRUCTS=Object.fromEntries(Object.entries(STRUCTURE_DATA).map(([id,s])=>[id,{
  repr:s.structureType,representation:s.representation,scale:s.representation==='representative microstructure'?'microstructure':'atomic / molecular',
  phase:s.phase,composition:s.composition,source:s.source.citation,sourceUrl:s.source.url,
  caveat:s.modellingNotes,exact:s.exact,limitations:s.limitations||[]
}]));

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
  const A=v3(L[0]).multiplyScalar(repeat[0]),B=v3(L[1]).multiplyScalar(repeat[1]),C=twoD?new THREE.Vector3():v3(L[2]).multiplyScalar(repeat[2]),O=twoD?v3(L[2]).multiplyScalar(.5):new THREE.Vector3();
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
function mxeneRecords(s,repeat){
  const L=s.lattice.vectors,backbone=s.atoms.slice(0,5),records=[];
  for(let x=0;x<repeat[0];x++)for(let y=0;y<repeat[1];y++){
    backbone.forEach(a=>records.push({element:a.element,role:a.role,occupancy:1,position:cart([a.fractional[0]+x,a.fractional[1]+y,a.fractional[2]],L)}));
    const kind=['O','OH','F'][(x+y*repeat[0])%3],site=[x+(kind==='F'?2/3:kind==='OH'?1/3:0),y+(kind==='F'?2/3:kind==='OH'?1/3:0)];
    [0,1].forEach(side=>{const z=side?.73:.27,face=side?'upper':'lower';
      if(kind==='F') records.push({element:'F',role:`${face} surface F termination`,occupancy:1,position:cart([site[0],site[1],z],L)});
      else { records.push({element:'O',role:`${face} surface ${kind} termination`,occupancy:1,position:cart([site[0],site[1],z],L)});
        if(kind==='OH') records.push({element:'H',role:`${face} hydroxyl hydrogen`,occupancy:1,position:cart([site[0],site[1],side?.77:.23],L)}); }
    });
  }
  return records;
}
function connectByRule(records,bonds,pair,min,max,coordination,color='#8e96a8',radius=.03){
  const count=new Array(records.length).fill(0);
  for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
    const a=records[i],b=records[j],match=(a.element===pair[0]&&b.element===pair[1])||(a.element===pair[1]&&b.element===pair[0]);
    if(!match||count[i]>=coordination||count[j]>=coordination)continue;
    const d=a.position.distanceTo(b.position);if(d>=min&&d<=max){bonds.add(bondMesh(a.position,b.position,color,radius));count[i]++;count[j]++;}
  }
}
function crystalModel(s){
  const root=new THREE.Group(),pickables=[],L=s.lattice.vectors,repeat=s.id==='zirconia'?[1,1,1]:(s.repeat||[2,2,2]); let basis=s.id==='zirconia'?yszRecords():s.atoms;
  const records=s.model&&s.model.kind==='mxene'?mxeneRecords(s,repeat):[],substitutions={};
  if(s.model&&s.model.kind==='substitute'){let cursor=2;s.model.substitutions.forEach(([el,n])=>{for(let i=0;i<n;i++){while(substitutions[cursor])cursor=(cursor+7)%27;substitutions[cursor]=el;cursor=(cursor+7)%27;}});}
  if(!records.length)for(let x=0;x<repeat[0];x++)for(let y=0;y<repeat[1];y++)for(let z=0;z<repeat[2];z++)basis.forEach(a=>{
    const f=a.fractional,n=records.length,el=substitutions[n]||a.element;
    records.push({element:el,role:el===a.element?a.role:`representative ${el} substitution`,occupancy:a.occupancy??1,position:cart([f[0]+x,f[1]+y,f[2]+z],L)});
  });
  addAtoms(root,records,pickables); const bonds=new THREE.Group(); bonds.userData.isBondLayer=true;
  (s.bondRules||[]).forEach(rule=>connectByRule(records,bonds,rule.pair,rule.min,rule.max,rule.coordination||99));
  if(s.model&&s.model.kind==='mxene'){
    connectByRule(records,bonds,['Ti','C'],1.9,2.45,6,'#6887a8',.028);
    connectByRule(records,bonds,['Ti','O'],1.6,2.5,3,'#a16c71',.025);
    connectByRule(records,bonds,['Ti','F'],1.6,2.5,3,'#73a878',.025);
    connectByRule(records,bonds,['O','H'],.75,1.25,1,'#d8d0c5',.021);
  }
  root.add(bonds); const cell=addCell(root,L,repeat,s.representation==='layered structure'); const label=makeLabel(s.model&&s.model.kind==='mxene'?'Ti–C–Ti–C–Ti · mixed Tₓ':s.structureType);label.position.set(0,-2.3,0);root.add(label);centerAndScale(root);
  return {group:root,pickables,cell,bonds,labels:[label],records};
}
function nanotube(s,root,records,bonds){const n=s.model.n,rows=s.model.rows,a=.42,R=n*a*Math.sqrt(3)/(2*Math.PI);for(let r=0;r<rows;r++)for(let k=0;k<2*n;k++){const th=(k+(r%2)*.5)*Math.PI/n;records.push({element:'C',role:'sp² carbon in (10,0) wall',occupancy:1,position:new THREE.Vector3(R*Math.cos(th),(r-(rows-1)/2)*a*.75,R*Math.sin(th))});}for(let i=0;i<records.length;i++){const candidates=[];for(let j=i+1;j<records.length;j++){const d=records[i].position.distanceTo(records[j].position);if(d<.53)candidates.push([d,j]);}candidates.sort((a,b)=>a[0]-b[0]).slice(0,3).forEach(([,j])=>bonds.add(bondMesh(records[i].position,records[j].position,'#7f8794',.025)));}}
function polymer(s,root,records,bonds){
  const seq=s.model.sequence,chains=s.model.chains||3,chainAtoms=[];
  for(let c=0;c<chains;c++){const row=[];for(let k=0;k<18;k++){
    const el=seq[k%seq.length],p=new THREE.Vector3((k-8.5)*.28,(c-(chains-1)/2)*.62+(k%2?.09:-.09),Math.sin(k*Math.PI/3+c)*.12),rec={element:el,role:`${s.phase} backbone`,occupancy:1,position:p};
    records.push(rec);row.push(rec);if(k)bonds.add(bondMesh(row[k-1].position,p,'#8b8296',.026));
    if(s.model.side&&k%seq.length===1){const side=s.model.side[(k/seq.length|0)%s.model.side.length],q=p.clone().add(new THREE.Vector3(0,.24*(c%2?1:-1),.2));records.push({element:side,role:'repeat-unit side group',occupancy:1,position:q});bonds.add(bondMesh(p,q,'#8b8296',.022));}
  }chainAtoms.push(row);}
  if(s.model.rings)for(let c=0;c<chains;c++)for(let unit=0;unit<3;unit++){const center=new THREE.Vector3(-1.72+unit*1.7,(c-(chains-1)/2)*.62,.05),ring=[];for(let j=0;j<6;j++){const p=center.clone().add(new THREE.Vector3(Math.cos(j*Math.PI/3)*.22,Math.sin(j*Math.PI/3)*.22,.08));const r={element:'C',role:'aromatic or saccharide ring motif',occupancy:1,position:p};records.push(r);ring.push(r);}for(let j=0;j<6;j++)bonds.add(bondMesh(ring[j].position,ring[(j+1)%6].position,'#8b8296',.022));}
  if(s.model.crosslinks)for(let c=0;c<chains-1;c++)[4,12].forEach(k=>bonds.add(bondMesh(chainAtoms[c][k].position,chainAtoms[c+1][k].position,'#c3a36e',.024)));
  if(s.model.lamella){const slab=new THREE.Mesh(new THREE.BoxGeometry(2.2,.85,.8),phaseMaterial('#7c6fa5',.12));slab.position.set(-.75,-.8,0);slab.userData.phase='ordered lamella';root.add(slab);}
  const repeatBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(seq.length*.28,.46,.54)),new THREE.LineBasicMaterial({color:0xd9c9a5,transparent:true,opacity:.55}));repeatBox.position.set(-1.65,(chains-1)*-.31,0);repeatBox.userData.phase='repeat-unit boundary';root.add(repeatBox);
}
function addPhaseLattice(phase,phaseIndex,records){const L=phase.lattice,basis=phase.basis,scale=.31,offset=phaseIndex?new THREE.Vector3(.82,0,0):new THREE.Vector3(-1.72,0,0);for(let x=0;x<3;x++)for(let y=0;y<3;y++)for(let z=0;z<3;z++)basis.forEach((f,k)=>{const p=cart([f[0]+x,f[1]+y,f[2]+z],L).multiplyScalar(scale).add(offset),marker=(x*9+y*3+z+k);records.push({element:marker%17===0?(phaseIndex?'V':'Al'):phase.element,role:phase.name+' periodic grain',occupancy:1,position:p});});}
function representativeModel(s){
 const root=new THREE.Group(),pickables=[],records=[],bonds=new THREE.Group();bonds.userData.isBondLayer=true;root.add(bonds);const kind=s.model.kind;
 if(kind==='nanotube')nanotube(s,root,records,bonds);
 else if(kind==='polymer')polymer(s,root,records,bonds);
 else if(kind==='liquid'){let i=0;for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++){if(x*x+y*y+z*z>7||i>=48)continue;const p=new THREE.Vector3(x*.42+(y%2)*.11,y*.38+(z%2)*.08,z*.4+Math.sin((x+2)*7+(y+2)*3+z)*.045),el=i%5===0?'In':'Ga';records.push({element:el,role:'dense liquid EGaIn coordination snapshot',occupancy:1,position:p});i++;}}
 else if(kind==='glass'){const silicon=[];for(let i=0;i<14;i++){const a=i*2.399,p=new THREE.Vector3(Math.cos(a)*(1+i%3*.23),(i%5-2)*.36,Math.sin(a)*(1+i%3*.23));silicon.push(p);records.push({element:'Si',role:'continuous-random-network former',occupancy:1,position:p});if(i){const prev=silicon[i-1],mid=prev.clone().lerp(p,.5);records.push({element:'O',role:'bridging oxygen',occupancy:1,position:mid});bonds.add(bondMesh(prev,mid,'#9a8590',.024));bonds.add(bondMesh(mid,p,'#9a8590',.024));}}[[-1.1,-.55,.8],[.9,.4,-.9],[-.3,.75,1.1],[1.15,-.65,.1],[-.85,.15,-1.05],[.35,-.8,.65]].forEach((p,i)=>records.push({element:i<4?'Na':'Ca',role:'network modifier in an interstice',occupancy:1,position:v3(p)}));}
 else if(kind==='aerogel'){for(let arm=0;arm<7;arm++){let prev=null;for(let i=0;i<9;i++){const a=arm*.9+i*.28,p=new THREE.Vector3(Math.cos(a)*(i*.16),i*.13-1.1,Math.sin(a)*(i*.16));const si={element:'Si',role:'amorphous silica cluster',occupancy:1,position:p};records.push(si);if(prev){const o={element:'O',role:'siloxane bridge',occupancy:1,position:prev.position.clone().lerp(p,.5)};records.push(o);bonds.add(bondMesh(prev.position,o.position,'#8795a0',.023));bonds.add(bondMesh(o.position,p,'#8795a0',.023));}prev=si;}}}
 else if(kind==='twophase'){s.model.phases.forEach((phase,i)=>addPhaseLattice(phase,i,records));const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),phaseMaterial('#d4b56d',.16));plane.rotation.y=Math.PI/2;plane.userData.phase='α/β grain boundary';root.add(plane);}
 else if(kind==='precipitate'){const L=s.model.lattice;for(let x=0;x<3;x++)for(let y=0;y<3;y++)for(let z=0;z<3;z++)records.push({element:'Al',role:'periodic FCC Al matrix',occupancy:1,position:cart([x,y,z],L).multiplyScalar(.34).add(new THREE.Vector3(-1.15,-1.05,-1.05))});for(let x=0;x<5;x++)for(let z=0;z<3;z++)records.push({element:['Al','Cu','Li'][(x+z)%3],role:'representative T1 platelet constituent',occupancy:1,position:new THREE.Vector3((x-2)*.38,.05,(z-1)*.38)});}
 else if(kind==='fibres'){const fibre=s.phases[0],matrixPhase=s.phases[1];for(let layer=0;layer<2;layer++)for(let i=0;i<10;i++){const geo=new THREE.CylinderGeometry(.09,.09,3.4,12),m=new THREE.Mesh(geo,phaseMaterial(fibre.color,.95));m.rotation.z=layer?Math.PI/2:0;m.position.set(layer?(i-4.5)*.28:0,layer?.45:-.45,layer?0:(i-4.5)*.28);m.userData.phase=fibre.name;root.add(m);}const matrix=new THREE.Mesh(new THREE.BoxGeometry(3.8,1.5,3.1),phaseMaterial(matrixPhase.color,.15));matrix.userData.phase=matrixPhase.name;root.add(matrix);}
 else if(kind==='hydrogel'){for(let c=0;c<5;c++){let prev=null;for(let i=0;i<10;i++){const p=new THREE.Vector3((i-4.5)*.3,(c-2)*.45+Math.sin(i+c)*.12,Math.cos(i*.8+c)*.4),r={element:i%4?'C':'O',role:'crosslinked polymer network',occupancy:1,position:p};records.push(r);if(prev)bonds.add(bondMesh(prev.position,p,'#71769c',.025));prev=r;}}for(let x=-2;x<=2;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=0;z++)records.push({element:'O',role:'water molecule marker in swollen network pore',occupancy:1,position:new THREE.Vector3(x*.58+(y%2)*.12,y*.68,z*.72+(x%2)*.1)});}
 else if(kind==='mycelium'){const hypha=s.phases[0],substrate=s.phases[1],mat=phaseMaterial(hypha.color,.9);const branch=(a,b,r)=>{const m=bondMesh(a,b,hypha.color,r,.9);m.material=mat;root.add(m);};for(let i=0;i<18;i++){const a=i*.9,p=new THREE.Vector3(0,-1.4,0),q=new THREE.Vector3(Math.cos(a)*(1+i%3*.3),-.7+(i%4)*.45,Math.sin(a)*(1+i%3*.3));branch(p,q,.045);if(i%2===0)branch(q,q.clone().add(new THREE.Vector3(Math.cos(a+.8)*.7,.45,Math.sin(a+.8)*.7)),.03);}for(let x=-2;x<=2;x++)for(let z=-1;z<=1;z++){const m=new THREE.Mesh(new THREE.BoxGeometry(.22,.14,.18),phaseMaterial(substrate.color,.95));m.position.set(x*.62+(z%2)*.16,-1.08+((x+z+6)%3)*.14,z*.72);m.userData.phase=substrate.name;root.add(m);}}
 addAtoms(root,records,pickables);const label=makeLabel(s.structureType);label.position.set(0,-2.0,0);root.add(label);centerAndScale(root);return {group:root,pickables,bonds,cell:null,labels:[label],records};
}

function buildStructure(id){const s=STRUCTURE_DATA[id];if(!s)return unavailableStructure(id,'Structure data unavailable');s.id=id;const r=s.lattice?crystalModel(s):representativeModel(s);r.meta=STRUCTS[id];r.legend=structureLegend(s,r.records);r.setBonds=on=>{if(r.bonds)r.bonds.visible=on;};r.setCell=on=>{if(r.cell)r.cell.visible=on;};r.setLabels=on=>r.labels.forEach(x=>x.visible=on);return r;}
function unavailableStructure(id,message){const g=new THREE.Group(),l=makeLabel(message,'#ef8b82');g.add(l);return{group:g,pickables:[],legend:[],unavailable:true,meta:{repr:'Unavailable',phase:'—',source:'No source'}};}
function structureLegend(s,records){const seen=[];(records||[]).forEach(r=>{if(!seen.includes(r.element))seen.push(r.element);});(s.elements||[]).forEach(e=>{if(!seen.includes(e))seen.push(e);});if(!(records||[]).length&&s.phases)return s.phases.map(p=>({symbol:'',name:p.name,color:p.color,role:'constituent phase'}));return seen.filter(symbol=>ELEMENTS[symbol]).map(symbol=>{const rec=(records||[]).find(r=>r.element===symbol);return{symbol,name:ELEMENTS[symbol].name,color:ELEMENTS[symbol].color,role:rec?rec.role:'implicit in represented composition; not explicitly rendered'};});}

function validateStructureData(db=STRUCTURE_DATA){const results=[],archetypes={'polymer chain':['polymer'],'atomic network':['glass','aerogel'],'representative microstructure':['twophase','precipitate','fibres','mycelium'],'representative model':['liquid','hydrogel']};Object.entries(db).forEach(([id,s])=>{const errors=[],warnings=[];const elems=new Set((s.atoms||[]).map(a=>a.element).concat(s.elements||[]));if(!STRUCTURE_TYPES.includes(s.representation))errors.push('unknown representation type');if(!s.structureType)errors.push('unknown structure label');if(archetypes[s.representation]&&!archetypes[s.representation].includes(s.model&&s.model.kind))errors.push('model geometry does not match declared archetype');if(['cloud','random','generic'].includes(s.model&&s.model.kind))errors.push('generic scattered-atom geometry');if(id==='mxene'&&(s.model&&s.model.stack||[]).join('-')!=='Ti-C-Ti-C-Ti')errors.push('incomplete Ti3C2Tx stack');if(!s.source||!s.source.citation||!s.source.url)errors.push('missing structure provenance');if(s.exact===false&&!s.modellingNotes)errors.push('representative model lacks modelling notes');if(s.exact===true&&!s.lattice)errors.push('exact structure lacks lattice');if(s.lattice&&(!Array.isArray(s.lattice.vectors)||s.lattice.vectors.length!==3||s.lattice.vectors.some(v=>v.length!==3||v.some(n=>!Number.isFinite(n)))))errors.push('invalid or incomplete lattice data');if(s.lattice&&(!s.atoms||!s.atoms.length)&&!(s.model&&s.model.kind==='ysz'))errors.push('missing coordinates');if(!elems.size&&!(s.phases&&s.phases.length))errors.push('missing element identities');elems.forEach(e=>{if(!ELEMENTS[e])errors.push('unknown element '+e);});if((s.bondRules||[]).some(b=>!b.pair||b.pair.length!==2||!(b.min>0)||!(b.max>b.min)))errors.push('invalid bond rule');if(s.genericFallback)errors.push('generic fallback structure');const colors=[...elems].filter(e=>ELEMENTS[e]).map(e=>ELEMENTS[e].color);if(elems.size>1&&new Set(colors).size===1)errors.push('multi-element structure has one colour');if(s.exact===true&&['representative model','representative microstructure','atomic network','polymer chain'].includes(s.representation))errors.push('representative structure claimed exact');if(s.exact===false)warnings.push('representative model; see limitations');results.push({id,representation:s.representation,structureType:s.structureType,source:s.source&&s.source.citation,status:errors.length?'FAIL':'PASS',errors,warnings,limitations:s.limitations||[]});});return results;}
function validateStructures(){return validateStructureData();}
function structValidationTable(){const rs=validateStructureData();return `<table><tr><th>Material</th><th>Representation</th><th>Source</th><th>Validation</th></tr>${rs.map(r=>`<tr><td>${r.id}</td><td>${r.structureType}</td><td>${r.source}</td><td>${r.status}</td></tr>`).join('')}</table>`;}
if(typeof module!=='undefined')module.exports={validateStructureData};
