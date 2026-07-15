/* ════════════════ COLLECTION VAULT ════════════════ */
let collSort='recent', collSel=null;
const Vault3D={ three:null, spec:null, rot:{x:-.2,y:.3}, drag:null,
  mount(id){ const wrap=$('#specimen3d-wrap'); if(!wrap) return;
    const cv=$('#specimen3d');
    if(!HAS3D){ const ctx=cv.getContext('2d'); cv.width=wrap.clientWidth; cv.height=wrap.clientHeight;
      drawPodGlyph(ctx,MATERIALS[id],cv.width,cv.height,1); return; }
    if(!this.three){ const st=GFX.stage(cv,{bloom:.18,fov:40});
      const r=st.renderer, sc=st.scene, cam=st.camera;
      sc.add(new THREE.HemisphereLight(0xdfe7f4,0x171526,.58));
      const k=new THREE.DirectionalLight(0xfff8ec,.72); k.position.set(3,5,6); sc.add(k);
      const c2=new THREE.DirectionalLight(0x8fd8f2,.3); c2.position.set(-5,-2,4); sc.add(c2);
      /* gallery pedestal + reflective floor */
      const floor=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.8,.16,48),
        new THREE.MeshPhysicalMaterial({color:0x14121f,metalness:.95,roughness:.18,envMapIntensity:1.8,
          clearcoat:1,clearcoatRoughness:.1}));
      floor.position.y=-1.85; sc.add(floor);
      const fring=GFX.ring(2.1,'#8b6cf0',.45,.02); fring.rotation.x=Math.PI/2; fring.position.y=-1.74; sc.add(fring);
      const fring2=GFX.ring(2.5,'#93dcf4',.2,.012); fring2.rotation.x=Math.PI/2; fring2.position.y=-1.78; sc.add(fring2);
      const under=GFX.glowSprite('#8b6cf0',7,.22); under.position.y=-1.7; sc.add(under);
      this.dust=GFX.particles(90,6.5,{color:'#a99df0',size:.2,opacity:.6}); sc.add(this.dust);
      this.three={r,sc,cam,st};
      wrap.addEventListener('pointerdown',e=>{ this.drag={x:e.clientX,y:e.clientY,rx:this.rot.x,ry:this.rot.y}; wrap.setPointerCapture(e.pointerId); });
      wrap.addEventListener('pointermove',e=>{ if(this.drag){ this.rot.y=this.drag.ry+(e.clientX-this.drag.x)*.008;
        this.rot.x=clamp(this.drag.rx+(e.clientY-this.drag.y)*.008,-1.4,1.4); } });
      wrap.addEventListener('pointerup',()=>this.drag=null);
      this.loop(); }
    if(this.spec) this.three.sc.remove(this.spec);
    this.structure=buildStructure(id);this.spec=this.structure.group;this.spec.scale.multiplyScalar(.72);this.three.sc.add(this.spec); },
  loop(){ requestAnimationFrame(()=>this.loop());
    if(CURRENT!=='collection'||!this.three||!this.spec) return;
    const wrap=$('#specimen3d-wrap'); if(!wrap) return;
    const w=wrap.clientWidth,h=wrap.clientHeight; if(!w) return;
    this.three.st.setSize(w,h);
    const t=now()/1000; const rm=document.documentElement.dataset.motion==='reduced';
    this.spec.rotation.x=lerp(this.spec.rotation.x,this.rot.x,.08);
    this.spec.rotation.y=lerp(this.spec.rotation.y,this.rot.y+(rm?0:t*.25),.08);
    if(this.spec.userData.breathe) this.spec.scale.setScalar(1+.05*Math.sin(t*1.6));
    if(!rm&&this.dust) this.dust.userData.drift(t,.35);
    this.three.cam.position.set(0,0,5.4); this.three.cam.lookAt(0,0,0);
    this.three.st.render(); } };

function drawPodGlyph(ctx,m,w,h,big){ // 2D thumbnail per specimen type
  ctx.clearRect(0,0,w,h); const cx=w/2,cy=h/2-6*big,t=now()/1000;
  const col=m.color;
  const g=ctx.createRadialGradient(cx,cy,2,cx,cy,w*.42);
  g.addColorStop(0,col+'44'); g.addColorStop(1,'transparent');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=1.2;
  const R=w*.2;
  switch(m.specimen){
    case 'veil': for(let r=0;r<4;r++)for(let c=0;c<5;c++){ const x=cx-R+c*R*.5,y=cy-R*.6+r*R*.42;
      ctx.beginPath(); for(let k=0;k<6;k++){ const a=k*Math.PI/3+Math.PI/6;
        ctx[k?'lineTo':'moveTo'](x+Math.cos(a)*R*.2,y+Math.sin(a)*R*.2);} ctx.closePath(); ctx.globalAlpha=.7; ctx.stroke(); }
      ctx.globalAlpha=1; break;
    case 'smoke': for(let i=0;i<5;i++){ ctx.globalAlpha=.16; ctx.beginPath();
      ctx.ellipse(cx+(i-2)*R*.24,cy+Math.sin(i*2)*R*.3,R*.55,R*.42,i,0,7); ctx.fill(); } ctx.globalAlpha=1; break;
    case 'gem': ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx+R*.8,cy); ctx.lineTo(cx,cy+R); ctx.lineTo(cx-R*.8,cy);
      ctx.closePath(); ctx.globalAlpha=.3; ctx.fill(); ctx.globalAlpha=1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx-R*.8,cy); ctx.lineTo(cx+R*.8,cy); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke(); break;
    case 'ribbon': ctx.beginPath(); for(let i=0;i<=40;i++){ const tt=i/40;
      ctx[i?'lineTo':'moveTo'](cx+Math.sin(tt*9)*R*.7,cy-R+tt*2*R); } ctx.stroke(); break;
    case 'tube': ctx.beginPath(); ctx.ellipse(cx,cy-R*.7,R*.4,R*.16,0,0,7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx-R*.4,cy-R*.7); ctx.lineTo(cx-R*.4,cy+R*.7); ctx.moveTo(cx+R*.4,cy-R*.7); ctx.lineTo(cx+R*.4,cy+R*.7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx,cy+R*.7,R*.4,R*.16,0,0,Math.PI); ctx.stroke(); break;
    case 'weave': for(let i=0;i<4;i++){ ctx.globalAlpha=.6; ctx.beginPath();
      ctx.ellipse(cx,cy,R*(.5+i*.16),R*(.5+i*.16)*.5,i*.7,0,7); ctx.stroke(); } ctx.globalAlpha=1; break;
    case 'layers': for(let i=0;i<4;i++){ ctx.globalAlpha=.75; ctx.strokeRect(cx-R*.75,cy-R*.5+i*R*.3,R*1.5,R*.12); } ctx.globalAlpha=1; break;
    case 'membrane': ctx.globalAlpha=.35; ctx.beginPath(); ctx.arc(cx,cy,R*.85,0,7); ctx.fill(); ctx.globalAlpha=1;
      ctx.beginPath(); ctx.arc(cx,cy,R*.85,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx,cy,R*.45,0,7); ctx.stroke(); break;
    case 'bloom': for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; ctx.globalAlpha=.5;
      ctx.beginPath(); ctx.ellipse(cx+Math.cos(a)*R*.5,cy+Math.sin(a)*R*.5,R*.34,R*.15,a,0,7); ctx.stroke(); } ctx.globalAlpha=1; break;
    case 'reef': for(let i=0;i<6;i++){ const x=cx+(i-2.5)*R*.3;
      ctx.beginPath(); ctx.moveTo(x-R*.08,cy+R*.6); ctx.lineTo(x,cy+R*.6-R*(.5+(i%3)*.25)); ctx.lineTo(x+R*.08,cy+R*.6); ctx.stroke(); } break;
    case 'blob': ctx.beginPath(); for(let i=0;i<=30;i++){ const a=i/30*Math.PI*2;
      const rr=R*(.7+.14*Math.sin(a*3+1)); ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*rr,cy+Math.sin(a)*rr); }
      ctx.closePath(); ctx.globalAlpha=.4; ctx.fill(); ctx.globalAlpha=1; ctx.stroke(); break;
    case 'coil': ctx.beginPath(); for(let i=0;i<=60;i++){ const tt=i/60;
      ctx[i?'lineTo':'moveTo'](cx+Math.cos(tt*17)*R*.5,cy-R*.8+tt*1.6*R); } ctx.stroke(); break;
    case 'pane': ctx.globalAlpha=.25; ctx.fillRect(cx-R*.6,cy-R*.85,R*1.2,R*1.7); ctx.globalAlpha=1;
      ctx.strokeRect(cx-R*.6,cy-R*.85,R*1.2,R*1.7); break;
    case 'ingot': ctx.save(); ctx.translate(cx,cy); ctx.rotate(.5);
      ctx.globalAlpha=.35; ctx.fillRect(-R*.3,-R*.85,R*.6,R*1.7); ctx.globalAlpha=1;
      ctx.strokeRect(-R*.3,-R*.85,R*.6,R*1.7); ctx.restore(); break;
    case 'shard': ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx+R*.45,cy+R*.75); ctx.lineTo(cx-R*.45,cy+R*.75);
      ctx.closePath(); ctx.globalAlpha=.4; ctx.fill(); ctx.globalAlpha=1; ctx.stroke(); break;
    case 'lattice3d': for(let ix=0;ix<3;ix++)for(let iy=0;iy<3;iy++){ const x=cx-R*.6+ix*R*.6,y=cy-R*.6+iy*R*.6;
      ctx.beginPath(); ctx.arc(x,y,2.2,0,7); ctx.fill();
      if(ix<2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+R*.6,y);ctx.globalAlpha=.4;ctx.stroke();ctx.globalAlpha=1;}
      if(iy<2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+R*.6);ctx.globalAlpha=.4;ctx.stroke();ctx.globalAlpha=1;} } break;
    default: ctx.beginPath(); ctx.arc(cx,cy,R*.7,0,7); ctx.globalAlpha=.4; ctx.fill(); ctx.globalAlpha=1; ctx.stroke(); }
}

function renderCollection(){
  const grid=$('#coll-grid'); if(!grid) return;
  const discIds=Object.keys(S.discovered);
  $('#coll-count').textContent=discIds.length+' / '+MAT_LIST.length;
  const rOrder={anomalous:6,legendary:5,epic:4,rare:3,uncommon:2,common:1};
  let ids=[...MAT_LIST];
  ids.sort((a,b)=>{ const da=!!S.discovered[a],db=!!S.discovered[b];
    if(da!==db) return da?-1:1;
    if(collSort==='recent') return (S.discovered[b]||0)-(S.discovered[a]||0);
    if(collSort==='rarity') return rOrder[MATERIALS[b].rarity]-rOrder[MATERIALS[a].rarity];
    if(collSort==='family') return MATERIALS[a].family.localeCompare(MATERIALS[b].family);
    if(collSort==='mastery') return (S.mastery[b]||0)-(S.mastery[a]||0);
    return 0; });
  grid.innerHTML=ids.map(id=>{ const m=MATERIALS[id],d=!!S.discovered[id];
    if(!d) return `<div class="pod locked" data-podid="${id}" title="Undiscovered — ${REGIONS[m.region].name}">
      <div class="pod-globe"></div>
      <div class="silhouette"><canvas width="200" height="230"></canvas></div>
      <div class="pod-label"><b class="dim">???</b><small>${m.code} · ${REGIONS[m.region].name}</small></div></div>`;
    return `<div class="pod ${collSel===id?'sel':''}" data-podid="${id}">
      <div class="pod-globe"><canvas width="200" height="230"></canvas></div>
      ${(S.dupes[id]||0)>0?`<span class="dupe">×${S.dupes[id]+1}</span>`:''}
      <button class="fav ${S.favs[id]?'on':''}" data-favid="${id}" aria-label="Favourite ${m.name}">
        <svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 5.9L12 16.4 6.7 19.3l1.2-5.9L3.4 9.3l6-.7z"/></svg></button>
      <div class="pod-label"><b>${m.name}</b><small>${m.code} · <span class="rarity ${m.rarity}" style="font-size:8px">${m.rarity}</span></small></div></div>`; }).join('');
  // draw thumbs
  $$('#coll-grid .pod').forEach(pod=>{ const id=pod.dataset.podid,m=MATERIALS[id];
    const cv=pod.querySelector('canvas'); const ctx=cv.getContext('2d');
    if(pod.classList.contains('locked')){ ctx.clearRect(0,0,200,230);
      ctx.strokeStyle='rgba(205,188,247,.22)'; ctx.setLineDash([3,4]);
      drawSilhouette(ctx,m); ctx.setLineDash([]);
      ctx.fillStyle='rgba(205,188,247,.35)'; ctx.font='20px serif'; ctx.textAlign='center'; ctx.fillText('🔒',100,120);
    } else drawPodGlyph(ctx,m,200,230,1);
    pod.addEventListener('click',e=>{ if(e.target.closest('.fav')) return;
      if(pod.classList.contains('locked')){ toast(`Unknown specimen — signals trace to ${REGIONS[m.region].name}`,'','hex'); return; }
      collSel=id; renderCollection(); collDetail(id); Sound.click(); }); });
  $$('#coll-grid [data-favid]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const id=b.dataset.favid; S.favs[id]=!S.favs[id]; save(); renderCollection(); }));
  // sets
  $('#coll-sets').innerHTML=SETS.map(s=>{ const have=s.ids.filter(id=>S.discovered[id]).length;
    const done=have===s.ids.length;
    return `<div class="setline ${done?'done':''}" title="${s.bonus}">
      <div class="sl-top"><span>${done?'✦ ':''}${s.n}</span><b>${have} / ${s.ids.length}</b></div>
      <div class="tr"><i style="width:${have/s.ids.length*100}%"></i></div>
      ${done?`<p class="tiny" style="color:var(--gold);margin-top:4px">${s.bonus}</p>`:''}</div>`; }).join('');
  // dupes
  const dupeTotal=Object.values(S.dupes).reduce((a,b)=>a+b,0);
  $('#dupe-count').textContent=dupeTotal;
  $('#dupe-convert').disabled=!dupeTotal;
  const badge=$('#coll-badge'); if(discIds.length){ badge.style.display='flex'; badge.textContent=discIds.length; }
}
function drawSilhouette(ctx,m){ ctx.save(); ctx.translate(0,0); ctx.globalAlpha=.8;
  ctx.strokeStyle='rgba(205,188,247,.25)'; drawPodGlyphOutline(ctx,m); ctx.restore(); }
function drawPodGlyphOutline(ctx,m){ const cx=100,cy=108,R=40;
  ctx.beginPath();
  switch(m.specimen){ case 'gem': case 'shard': ctx.moveTo(cx,cy-R); ctx.lineTo(cx+R*.7,cy+R*.6); ctx.lineTo(cx-R*.7,cy+R*.6); ctx.closePath(); break;
    case 'ribbon': case 'coil': for(let i=0;i<=30;i++){ const t=i/30; ctx[i?'lineTo':'moveTo'](cx+Math.sin(t*8)*R*.6,cy-R+t*2*R); } break;
    default: ctx.arc(cx,cy,R*.8,0,7); }
  ctx.stroke(); }
function collDetail(id){ const m=MATERIALS[id]; const el=$('#coll-detail'); const ml=masteryLevel(id);
  el.innerHTML=`<div class="panel-title">Specimen</div><div class="panel-body">
    <div id="specimen3d-wrap"><canvas id="specimen3d"></canvas></div>
    <h3 class="display" style="font-size:26px;margin-top:12px">${m.name}</h3>
    <div class="row" style="gap:10px;margin:4px 0 10px"><span class="mono tiny dim">${m.code}</span><span class="rarity ${m.rarity}">${m.rarity}</span></div>
    <p class="tiny" style="font-style:italic;color:var(--lilac);line-height:1.65">${m.lore}</p>
    <div class="divider"></div>
    <div class="kv"><span>Mastery</span><b>Lv. ${ml.lv} — ${MASTERY_NAMES[ml.lv]}</b></div>
    <div class="kv"><span>Family</span><b>${FAMILIES[m.family].name}</b></div>
    <div class="kv"><span>Duplicates</span><b>${S.dupes[id]||0}</b></div>
    <div class="eyebrow" style="margin:12px 0 8px">Mastery challenges</div>
    <div class="kv"><span>Scan the structure</span><b>${S.msteps&&S.msteps[id]&&S.msteps[id].scan?'✓':'—'}</b></div>
    <div class="kv"><span>Run a lab protocol</span><b>${S.simResults.some(r=>r.mat===id)?'✓':'—'}</b></div>
    <div class="kv"><span>Use in a loadout</span><b>${Object.values(S.loadoutSlots).includes(id)?'✓':'—'}</b></div>
    <div class="ctl-group" style="margin-top:14px">
      <button class="ctl sm primary" id="cd-open">Open entry</button>
      <button class="ctl sm" id="cd-sanctum">Display in Sanctum</button></div>
    <p class="tiny dim" style="margin-top:8px">Drag the specimen to rotate.</p></div>`;
  Vault3D.mount(id);
  const wrap=$('#specimen3d-wrap');
  if(wrap){ wrap.style.transition='none'; wrap.style.opacity='0'; wrap.style.transform='scale(.94)';
    requestAnimationFrame(()=>{ wrap.style.transition='opacity .7s var(--ease-out), transform .7s var(--ease-spring)';
      wrap.style.opacity='1'; wrap.style.transform='scale(1)'; }); }
  $('#cd-open').addEventListener('click',()=>{ Codex.show(id); nav('codex'); });
  $('#cd-sanctum').addEventListener('click',()=>{ S.sanctum=id; save(); Sound.glass();
    toast(`${m.name} now presides over your Sanctum`); logEntry(`${m.name} displayed in the personal Sanctum.`); });
}
$$('[data-csort]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-csort]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); collSort=b.dataset.csort; renderCollection(); }));
$('#dupe-convert').addEventListener('click',()=>{ const dupeTotal=Object.values(S.dupes).reduce((a,b)=>a+b,0);
  if(!dupeTotal) return; const gain=dupeTotal*110; S.dupes={}; addCredits(gain,'· duplicates converted');
  logEntry(`Converted ${dupeTotal} duplicate samples into ${gain} research credits.`); renderCollection(); });
SCREEN_HOOKS.collection={enter(){ renderCollection(); if(collSel) collDetail(collSel); }};
