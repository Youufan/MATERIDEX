/* ════════════════ MATERIAL INDEX ════════════════ */
const NL_MAP={ conductive:['conductive'], conductor:['conductive'], conductors:['conductive'],
  flexible:['flexible','stretchable','soft'], flex:['flexible'], stretchy:['stretchable'], stretchable:['stretchable'],
  wearable:['wearable'], wearables:['wearable'], skin:['wearable','biocompatible'],
  strong:['strong'], strength:['strong'], tough:['tough','strong'], hard:['hard'],
  light:['light'], lightweight:['light'], aerospace:['aerospace','light'], aircraft:['aerospace'], rocket:['aerospace','cryogenic'], space:['aerospace','thermal'],
  transparent:['transparent'], clear:['transparent'], optical:['optical','transparent'], electrode:['electrode','conductive'],
  thermal:['thermal'], insulating:['insulation'], insulation:['insulation'], insulator:['insulator','insulation'], heat:['thermal'],
  cheap:['cheap'], affordable:['cheap'], sustainable:['sustainable','renewable'], green:['sustainable'], biodegradable:['biodegradable','compostable'], compostable:['compostable'],
  bio:['bio','biocompatible'], biocompatible:['biocompatible'], implant:['implant','biocompatible'], medical:['biocompatible','implant','medical'],
  solar:['solar'], energy:['solar','energy'], battery:['energy'], semiconductor:['semiconductor'],
  marine:['marine','corrosion'], corrosion:['corrosion'], seawater:['marine','corrosion'], rust:['corrosion'],
  soft:['soft'], smart:['smart','memory'], memory:['memory'], actuator:['actuator'],
  carbon:['carbon'], fibre:['fibre'], fiber:['fibre'], packaging:['packaging'], armour:['armour'], armor:['armour'],
  electronics:['conductive','semiconductor','wearable','electronic'], electronic:['electronic'] };

const Constellation={ nodes:{}, edges:[], sel:null, hover:null, cam:{x:0,y:0,z:1}, drag:null, mode:'constellation',
  pulses:[], filters:{family:new Set(),rarity:new Set(),disc:new Set()}, query:'', matches:new Set(MAT_LIST),
init(){
  this.cv=$('#index-canvas'); this.ctx=this.cv.getContext('2d');
  // nodes: seed positions by family cluster
  const famKeys=Object.keys(FAMILIES);
  MAT_LIST.forEach((id,i)=>{ const m=MATERIALS[id]; const fi=famKeys.indexOf(m.family);
    const a=fi/famKeys.length*Math.PI*2 + (i%3)*.3;
    const r=170+((i*57)%90);
    this.nodes[id]={x:Math.cos(a)*r+(Math.random()-.5)*60, y:Math.sin(a)*r*.72+(Math.random()-.5)*50, vx:0,vy:0,
      z:Math.random(), zT:.6, flash:0,
      R: m.rarity==='legendary'?15 : m.rarity==='epic'?12 : m.rarity==='rare'?10 : 8}; });
  MAT_LIST.forEach(id=>MATERIALS[id].related.forEach(r=>{ if(MATERIALS[r]) this.edges.push([id,r]); }));
  // interactions
  const cv=this.cv;
  cv.addEventListener('pointerdown',e=>{ const p=this.pt(e);
    const hit=this.nodeAt(p); this.drag={x:e.clientX,y:e.clientY,cx:this.cam.x,cy:this.cam.y,hit,moved:false};
    cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove',e=>{ const p=this.pt(e);
    this.mxN=(p.sx/p.w-.5)*2; this.myN=(p.sy/p.h-.5)*2;
    if(this.drag){ const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
      if(Math.hypot(dx,dy)>4) this.drag.moved=true;
      if(this.drag.moved&&!this.drag.hit){ this.cam.x=this.drag.cx-dx/this.cam.z; this.cam.y=this.drag.cy-dy/this.cam.z; } }
    else this.hover=this.nodeAt(p); });
  cv.addEventListener('pointerup',e=>{ if(this.drag&&!this.drag.moved){
      const hit=this.drag.hit||this.nodeAt(this.pt(e));
      if(this.mode==='property'){ if(hit) this.preview(hit); }
      else if(hit) this.preview(hit); else {this.sel=null; $('#idx-preview').style.display='none';} }
    this.drag=null; });
  cv.addEventListener('wheel',e=>{ e.preventDefault(); this.cam.z=clamp(this.cam.z*(1-e.deltaY*.0012),.45,3); },{passive:false});
  // modes
  $$('.imode').forEach(b=>b.addEventListener('click',()=>{ $$('.imode').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); this.setMode(b.dataset.imode); Sound.click(); }));
  // search
  const inp=$('#idx-search'); let deb;
  inp.addEventListener('input',()=>{ clearTimeout(deb); deb=setTimeout(()=>{ this.query=inp.value; this.applyFilters(); },200); });
  $$('.idx-eg').forEach(el=>el.addEventListener('click',()=>{ inp.value=el.textContent; this.query=inp.value; this.applyFilters(); }));
  // filter chips
  const famWrap=$('#flt-family');
  Object.entries(FAMILIES).forEach(([k,f])=>{ const c=document.createElement('button'); c.className='chip'; c.textContent=f.name;
    c.addEventListener('click',()=>{ c.classList.toggle('on'); this.filters.family[c.classList.contains('on')?'add':'delete'](k); this.applyFilters(); });
    famWrap.appendChild(c); });
  ['common','uncommon','rare','epic','legendary'].forEach(r=>{ const c=document.createElement('button'); c.className='chip'; c.textContent=r;
    c.addEventListener('click',()=>{ c.classList.toggle('on'); this.filters.rarity[c.classList.contains('on')?'add':'delete'](r); this.applyFilters(); });
    $('#flt-rarity').appendChild(c); });
  [['disc','Discovered'],['und','Undiscovered'],['fav','Favourites'],['trk','Tracked']].forEach(([k,l])=>{ const c=document.createElement('button'); c.className='chip'; c.textContent=l;
    c.addEventListener('click',()=>{ c.classList.toggle('on'); this.filters.disc[c.classList.contains('on')?'add':'delete'](k); this.applyFilters(); });
    $('#flt-disc').appendChild(c); });
  $('#flt-clear').addEventListener('click',()=>{ this.filters.family.clear(); this.filters.rarity.clear(); this.filters.disc.clear();
    $('#idx-search').value=''; this.query=''; $$('#flt-family .chip,#flt-rarity .chip,#flt-disc .chip').forEach(c=>c.classList.remove('on')); this.applyFilters(); });
  $('#idx-save-search').addEventListener('click',()=>{ if(!this.query.trim()){toast('Type a search first','verm','alert');return;}
    if(!S.savedSearches.includes(this.query)){ S.savedSearches.unshift(this.query); S.savedSearches=S.savedSearches.slice(0,6); save(); this.renderSaved(); toast('Search saved'); } });
  // axes
  const axisOpts=[['strength','Strength /10'],['conductivity','Conductivity /10'],['flexibility','Flexibility /10'],
    ['stability','Stability /10'],['sustainability','Sustainability /10'],['affordability','Affordability /10'],
    ['rho','Density kg/m³'],['sigma','Strength MPa'],['E','Stiffness GPa'],['costkg','Cost $/kg'],['co2','Embodied CO₂ kg/kg']];
  ['axis-x','axis-y'].forEach((aid,i)=>{ const sel=$('#'+aid);
    axisOpts.forEach(([v,l])=>{ const o=document.createElement('option'); o.value=v; o.textContent=(i?'Y · ':'X · ')+l; sel.appendChild(o); });
    sel.value=i?'rho':'sigma';
    sel.addEventListener('change',()=>{ const pair=$('#axis-x').value+'|'+$('#axis-y').value;
      if(!S.axisPairs.includes(pair)){ S.axisPairs.push(pair); save(); checkAchievements(); } }); });
  this.renderSaved(); this.applyFilters(); this.loop();
},
setMode(mode){ this.mode=mode;
  $('#taxo-wrap').style.display= mode==='taxonomy'?'block':'none';
  $('#prop-axes').style.display= mode==='property'?'flex':'none';
  this.cv.style.display = mode==='taxonomy'?'none':'block';
  if(mode==='taxonomy') this.renderTaxonomy();
},
pt(e){ const r=this.cv.getBoundingClientRect(); const x=(e.clientX-r.left),y=(e.clientY-r.top);
  return {sx:x,sy:y, x:(x-r.width/2)/this.cam.z+this.cam.x, y:(y-r.height/2)/this.cam.z+this.cam.y, w:r.width,h:r.height}; },
nodeAt(p){ if(this.mode==='property'){ let best=null;
    MAT_LIST.forEach(id=>{ const n=this.nodes[id]; if(!this.matches.has(id))return;
      const d=Math.hypot((n.px||0)-p.sx,(n.py||0)-p.sy); if(d<16&&(!best||d<best.d)) best={id,d}; });
    return best?best.id:null; }
  let best=null; MAT_LIST.forEach(id=>{ const n=this.nodes[id];
    const d=Math.hypot(n.x-p.x,n.y-p.y); if(d<n.R+8&&(!best||d<best.d)) best={id,d}; });
  return best?best.id:null; },
applyFilters(){ const q=this.query.toLowerCase();
  const words=q.split(/[^a-z]+/).filter(Boolean);
  const wanted=new Set(); words.forEach(w=>{ (NL_MAP[w]||[]).forEach(t=>wanted.add(t)); });
  this.matches=new Set();
  MAT_LIST.forEach(id=>{ const m=MATERIALS[id];
    if(this.filters.family.size&&!this.filters.family.has(m.family)) return;
    if(this.filters.rarity.size&&!this.filters.rarity.has(m.rarity)) return;
    const disc=!!S.discovered[id];
    if(this.filters.disc.size){ let ok=false;
      if(this.filters.disc.has('disc')&&disc) ok=true;
      if(this.filters.disc.has('und')&&!disc) ok=true;
      if(this.filters.disc.has('fav')&&S.favs[id]) ok=true;
      if(this.filters.disc.has('trk')&&S.tracked[id]) ok=true;
      if(!ok) return; }
    if(q.trim()){
      const hay=(m.name+' '+m.formula+' '+m.cls+' '+m.tags.join(' ')).toLowerCase();
      let hit = hay.includes(q.trim());
      if(!hit&&wanted.size){ let score=0; wanted.forEach(t=>{ if(m.tags.includes(t)) score++; });
        hit = score>= Math.min(2,wanted.size); }
      if(!hit&&words.length){ hit=words.some(w=>w.length>3&&hay.includes(w)); }
      if(!hit) return; }
    this.matches.add(id); });
  MAT_LIST.forEach(id=>{ const n=this.nodes[id]; if(!n) return;
    const was=(n.zT||0)>.7;
    n.zT=this.matches.has(id)? .82+(S.discovered[id]?.16:0) : .15;
    if(!was&&n.zT>.7) n.flash=1; });
  const nd=[...this.matches].filter(id=>S.discovered[id]).length;
  $('#idx-n-match').textContent=this.matches.size+' matches';
  $('#idx-n-disc').textContent=nd+' discovered';
  $('#idx-n-und').textContent=(this.matches.size-nd)+' undiscovered silhouettes';
  this.drawRing(); if(this.mode==='taxonomy') this.renderTaxonomy();
},
drawRing(){ const cv=$('#idx-ring-canvas'),ctx=cv.getContext('2d'); cv.width=240; cv.height=240; ctx.clearRect(0,0,240,240);
  const tot=MAT_LIST.length, match=this.matches.size, disc=[...this.matches].filter(id=>S.discovered[id]).length;
  const arc=(r,frac,color,lw)=>{ ctx.beginPath(); ctx.arc(120,120,r,-Math.PI/2,-Math.PI/2+frac*2*Math.PI);
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.shadowColor=color; ctx.shadowBlur=8; ctx.stroke(); ctx.shadowBlur=0; };
  ctx.beginPath(); ctx.arc(120,120,86,0,7); ctx.strokeStyle='rgba(244,240,232,.07)'; ctx.lineWidth=10; ctx.stroke();
  arc(86,match/tot,'#8b6cf0',10); arc(70,disc/Math.max(1,tot),'#8fd8f2',6);
  ctx.fillStyle='#f4f0e8'; ctx.font='300 34px "Cormorant Garamond"'; ctx.textAlign='center';
  ctx.fillText(match,120,126); ctx.font='9px "Archivo Narrow"'; ctx.fillStyle='rgba(169,162,148,.9)';
  ctx.fillText('OF '+tot+' MATERIALS',120,146); },
renderSaved(){ const el=$('#idx-saved');
  el.innerHTML=S.savedSearches.length? S.savedSearches.map(s=>`<button class="chip" style="margin:3px 4px 3px 0" data-ss="${esc(s)}">${esc(s)}</button>`).join('') : '<p class="tiny dim">No saved searches yet.</p>';
  $$('#idx-saved [data-ss]').forEach(b=>b.addEventListener('click',()=>{ $('#idx-search').value=b.dataset.ss; this.query=b.dataset.ss; this.applyFilters(); })); },
renderRecent(){ const el=$('#idx-recent'); const ids=S.recentViewed.filter(id=>MATERIALS[id]);
  el.innerHTML=ids.length? ids.map(id=>{ const m=MATERIALS[id];
    return `<button class="chip" style="margin:3px 4px 3px 0" data-rv="${id}">${S.discovered[id]?m.name:'??? '+m.code}</button>`; }).join('') : '<p class="tiny dim">Nothing viewed yet.</p>';
  $$('#idx-recent [data-rv]').forEach(b=>b.addEventListener('click',()=>{ Codex.show(b.dataset.rv); nav('codex'); })); },
preview(id){ this.sel=id; const m=MATERIALS[id]; const disc=S.discovered[id];
  $('#idx-preview').style.display='block'; Sound.hover();
  $('#idx-preview-body').innerHTML=`
    <div class="row" style="gap:10px"><div class="sw" style="width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3,${m.color} 45%,#0007 130%);box-shadow:0 0 16px ${m.color}66"></div>
      <div><b style="font-size:14px;letter-spacing:.12em">${disc?m.name.toUpperCase():'UNKNOWN SPECIMEN'}</b><br>
      <span class="mono tiny dim">${m.code}</span> <span class="rarity ${m.rarity}" style="font-size:8.5px">${m.rarity}</span></div></div>
    <p class="tiny" style="margin:10px 0;line-height:1.6;color:var(--pearl-dim)">${disc?m.summary:'Signature detected in '+REGIONS[m.region].name+'. '+(m.tags.slice(0,3).join(' · '))+' traits suspected. Scan to resolve.'}</p>
    ${disc?`<div class="pbar"><span>Strength</span><div class="tr"><i style="width:${m.radar.strength*10}%"></i></div><b>${m.radar.strength}</b></div>
    <div class="pbar"><span>Conductivity</span><div class="tr"><i style="width:${m.radar.conductivity*10}%"></i></div><b>${m.radar.conductivity}</b></div>
    <div class="pbar"><span>Flexibility</span><div class="tr"><i style="width:${m.radar.flexibility*10}%"></i></div><b>${m.radar.flexibility}</b></div>`:''}
    <div class="ctl-group" style="margin-top:12px">
      <button class="ctl sm primary" id="pv-open">Open entry</button>
      <button class="ctl sm" id="pv-cmp">Compare</button>
      <button class="ctl sm" id="pv-fav">${S.favs[id]?'★ Favourited':'☆ Favourite'}</button></div>`;
  $('#pv-open').addEventListener('click',()=>{ Codex.show(id); nav('codex'); });
  $('#pv-cmp').addEventListener('click',()=>{ Loadout.addCompare(id); nav('loadout'); });
  $('#pv-fav').addEventListener('click',()=>{ S.favs[id]=!S.favs[id]; save(); this.preview(id); renderCollection(); });
},
renderTaxonomy(){ const el=$('#taxo-wrap');
  el.innerHTML=Object.entries(FAMILIES).map(([k,f])=>{ const kids=MAT_LIST.filter(id=>MATERIALS[id].family===k&&this.matches.has(id));
    if(!kids.length) return '';
    const nd=kids.filter(id=>S.discovered[id]).length;
    return `<div class="taxo-family open"><div class="taxo-head">
      <span style="width:11px;height:11px;border-radius:50%;background:${f.color};box-shadow:0 0 10px ${f.color}"></span>
      <span class="tf-name">${f.name}</span><span class="mono tiny dim">${nd} / ${kids.length}</span></div>
      <div class="taxo-kids">${kids.map(id=>{ const m=MATERIALS[id]; const d=S.discovered[id];
        return `<div class="taxo-item ${d?'':'undisc'}" data-tx="${id}">
          <span class="dot" style="background:${d?m.color:'transparent'};border:1px solid ${m.color};box-shadow:${d?'0 0 8px '+m.color:'none'}"></span>
          <span>${d?m.name:'??? — undiscovered'}</span><span class="mono tiny dim" style="margin-left:auto">${m.code}</span>
          <span class="rarity ${m.rarity}" style="font-size:8px">${m.rarity}</span></div>`; }).join('')}</div></div>`; }).join('');
  $$('.taxo-head').forEach(h=>h.addEventListener('click',()=>h.parentElement.classList.toggle('open')));
  $$('.taxo-item').forEach(t=>t.addEventListener('click',()=>this.preview(t.dataset.tx)));
},
pulse(id){ if(this.nodes[id]) this.pulses.push({id,t:1}); },
loop(){ requestAnimationFrame(()=>this.loop());
  if(CURRENT!=='index'||this.mode==='taxonomy') return;
  const cv=this.cv,wrap=$('#index-canvas-wrap');
  const w=wrap.clientWidth,h=wrap.clientHeight; if(!w) return;
  if(cv.width!==w*PR){ cv.width=w*PR; cv.height=h*PR; }
  const ctx=this.ctx; ctx.setTransform(PR,0,0,PR,0,0); ctx.clearRect(0,0,w,h);
  const t=now()/1000;
  if(this.mode==='property'){ this.drawProperty(ctx,w,h,t); return; }
  // physics
  const rm=document.documentElement.dataset.motion==='reduced';
  if(!rm){ MAT_LIST.forEach(id=>{ const n=this.nodes[id];
      // centre gravity + family cohesion
      n.vx+=(-n.x)*.0004; n.vy+=(-n.y)*.0004;
      MAT_LIST.forEach(o=>{ if(o===id)return; const m=this.nodes[o];
        const dx=n.x-m.x,dy=n.y-m.y,d2=dx*dx+dy*dy+40;
        if(d2<5200){ const f=90/d2; n.vx+=dx*f*.06; n.vy+=dy*f*.06; } });
      if(!this.matches.has(id)){ n.vx+=(-n.x*1.9-n.x)*.0002; } });
    this.edges.forEach(([a,b])=>{ const na=this.nodes[a],nb=this.nodes[b];
      const dx=nb.x-na.x,dy=nb.y-na.y,d=Math.hypot(dx,dy)||1,f=(d-110)*.0006;
      na.vx+=dx/d*f*d*.01; na.vy+=dy/d*f*d*.01; nb.vx-=dx/d*f*d*.01; nb.vy-=dy/d*f*d*.01; });
    MAT_LIST.forEach(id=>{ const n=this.nodes[id]; n.vx*=.9; n.vy*=.9; n.x+=n.vx; n.y+=n.vy; }); }
  const X=x=>(x-this.cam.x)*this.cam.z+w/2, Y=y=>(y-this.cam.y)*this.cam.z+h/2;
  const mxp=this.mxN||0, myp=this.myN||0;
  /* deep particulate layer */
  if(!this.dust){ this.dust=[]; for(let i=0;i<170;i++) this.dust.push({x:(Math.random()-.5)*1700,y:(Math.random()-.5)*1100,z:Math.random()*.55,tw:Math.random()*7}); }
  this.dust.forEach(d=>{ const px=X(d.x)+mxp*(d.z-.5)*60, py=Y(d.y)+myp*(d.z-.5)*40;
    ctx.fillStyle=`rgba(205,188,247,${.05+.1*d.z*(.6+.4*Math.sin(t*1.2+d.tw))})`;
    ctx.beginPath(); ctx.arc(px,py,(.6+d.z*1.4)*this.cam.z,0,7); ctx.fill(); });
  MAT_LIST.forEach(id=>{ const n=this.nodes[id]; n.z=lerp(n.z==null?.5:n.z,n.zT==null?.6:n.zT,.05); if(n.flash>0) n.flash-=.014; });
  const par=(n)=>({x:X(n.x)+mxp*(n.z-.5)*46, y:Y(n.y)+myp*(n.z-.5)*32});
  /* relationship threads — curved, depth-weighted */
  this.edges.forEach(([a,b])=>{ const na=this.nodes[a],nb=this.nodes[b];
    const on=this.matches.has(a)&&this.matches.has(b);
    const pa=par(na),pb=par(nb);
    const qx=(pa.x+pb.x)/2+(na.y-nb.y)*.08, qy=(pa.y+pb.y)/2+(nb.x-na.x)*.08;
    const zavg=(na.z+nb.z)/2;
    const al=on? .09+zavg*.2 : .025;
    const gr=ctx.createLinearGradient(pa.x,pa.y,pb.x,pb.y);
    gr.addColorStop(0,`rgba(147,220,244,${al})`); gr.addColorStop(1,`rgba(205,188,247,${al})`);
    ctx.strokeStyle=gr; ctx.lineWidth=on? .5+zavg : .5;
    ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.quadraticCurveTo(qx,qy,pb.x,pb.y); ctx.stroke(); });
  ctx.lineWidth=1;
  /* scan pulses */
  this.pulses=this.pulses.filter(p=>p.t>0);
  this.pulses.forEach(p=>{ p.t-=.012; const pp=par(this.nodes[p.id]);
    ctx.beginPath(); ctx.arc(pp.x,pp.y,(1-p.t)*110*this.cam.z,0,7);
    ctx.strokeStyle=`rgba(147,220,244,${p.t*.5})`; ctx.lineWidth=1.5; ctx.stroke(); ctx.lineWidth=1; });
  /* nodes — painter order by depth */
  const order=[...MAT_LIST].sort((a,b)=>this.nodes[a].z-this.nodes[b].z);
  order.forEach(id=>{ const n=this.nodes[id],m=MATERIALS[id];
    const on=this.matches.has(id), disc=S.discovered[id];
    const pp=par(n);
    const depth=.45+n.z*.85;
    const R=n.R*this.cam.z*depth*(this.hover===id?1.35:1);
    const alpha= on? .55+n.z*.45 : .12;
    const tw=.75+.25*Math.sin(t*2+n.x);
    if(S.tracked[id]&&on){ ctx.beginPath(); ctx.arc(pp.x,pp.y,R+8+Math.sin(t*3)*2,0,7);
      ctx.strokeStyle='rgba(217,201,165,.6)'; ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]); }
    const grad=ctx.createRadialGradient(pp.x-R*.3,pp.y-R*.3,R*.1,pp.x,pp.y,R*2.3);
    if(disc){ grad.addColorStop(0,`rgba(255,255,255,${.95*alpha})`); grad.addColorStop(.3,m.color+(on?'dd':'22'));
      grad.addColorStop(1,'rgba(0,0,0,0)'); }
    else{ grad.addColorStop(0,`rgba(163,156,141,${.4*alpha*tw})`); grad.addColorStop(1,'rgba(0,0,0,0)'); }
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(pp.x,pp.y,R*2.3,0,7); ctx.fill();
    const body=ctx.createRadialGradient(pp.x-R*.28,pp.y-R*.32,R*.05,pp.x,pp.y,R*.85);
    if(disc){ body.addColorStop(0,'rgba(255,255,255,.95)'); body.addColorStop(.35,m.color); body.addColorStop(1,'rgba(8,8,18,.9)'); }
    else{ body.addColorStop(0,'rgba(60,58,86,.9)'); body.addColorStop(1,'rgba(14,14,26,.95)'); }
    ctx.globalAlpha=alpha; ctx.fillStyle=body;
    ctx.beginPath(); ctx.arc(pp.x,pp.y,R*.62,0,7); ctx.fill();
    if(!disc){ ctx.strokeStyle='rgba(205,188,247,.5)'; ctx.setLineDash([2,3]); ctx.stroke(); ctx.setLineDash([]); }
    if(disc){ ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath();
      ctx.ellipse(pp.x-R*.2,pp.y-R*.26,R*.16,R*.09,-.6,0,7); ctx.fill(); }
    if((m.rarity==='legendary'||m.rarity==='epic')&&on&&disc){ ctx.beginPath();
      ctx.arc(pp.x,pp.y,R*.86,t*.4,t*.4+4.6);
      ctx.strokeStyle=m.rarity==='legendary'?'rgba(255,95,60,.6)':'rgba(167,139,250,.55)'; ctx.stroke(); }
    if(n.flash>0){ ctx.beginPath(); ctx.arc(pp.x,pp.y,R*(1+(1-n.flash)*2.4),0,7);
      ctx.strokeStyle=`rgba(255,255,255,${n.flash*.5})`; ctx.stroke(); }
    ctx.globalAlpha=1;
    const showLbl=(this.hover===id||this.sel===id)||(on&&n.z>.72&&this.cam.z>.85);
    if(showLbl&&on){ ctx.fillStyle=`rgba(246,242,234,${.5+n.z*.5})`; ctx.font='500 10px "Archivo Narrow"';
      ctx.textAlign='center';
      ctx.fillText((disc?m.name:'???').toUpperCase(),pp.x,pp.y-R-9);
      ctx.fillStyle='rgba(163,156,141,.7)'; ctx.font='7.5px "IBM Plex Mono"'; ctx.fillText(m.code,pp.x,pp.y+R+14); } });
  this.cv.style.cursor=this.hover?'pointer':'grab';
},
drawProperty(ctx,w,h,t){ const ax=$('#axis-x').value, ay=$('#axis-y').value;
  const val=(m,k)=> (k in m.radar)? m.radar[k] : (m.load?m.load[k]:0)||0;
  const log=k=>['rho','sigma','E','costkg','co2'].includes(k);
  const vals=x=>MAT_LIST.map(id=>val(MATERIALS[id],x)).filter(v=>v>0);
  const tf=(v,k)=> log(k)? Math.log10(Math.max(v,.0001)) : v;
  const xs=vals(ax).map(v=>tf(v,ax)), ys=vals(ay).map(v=>tf(v,ay));
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const pad=64;
  ctx.strokeStyle='rgba(244,240,232,.12)'; ctx.beginPath();
  ctx.moveTo(pad,h-pad); ctx.lineTo(w-30,h-pad); ctx.moveTo(pad,h-pad); ctx.lineTo(pad,50); ctx.stroke();
  ctx.fillStyle='rgba(169,162,148,.9)'; ctx.font='9px "Archivo Narrow"'; ctx.textAlign='center';
  ctx.fillText(($('#axis-x').selectedOptions[0].textContent+(log(ax)?'  (log)':'')).toUpperCase(),w/2,h-30);
  ctx.save(); ctx.translate(26,h/2); ctx.rotate(-Math.PI/2);
  ctx.fillText(($('#axis-y').selectedOptions[0].textContent+(log(ay)?'  (log)':'')).toUpperCase(),0,0); ctx.restore();
  MAT_LIST.forEach(id=>{ const m=MATERIALS[id]; const vx=val(m,ax),vy=val(m,ay); if(vx<=0&&vy<=0) return;
    const n=this.nodes[id]; const on=this.matches.has(id),disc=S.discovered[id];
    const px=pad+ (tf(vx,ax)-x0)/(x1-x0||1)*(w-pad-50), py=(h-pad)-(tf(vy,ay)-y0)/(y1-y0||1)*(h-pad-70);
    n.px=lerp(n.px||px,px,.12); n.py=lerp(n.py||py,py,.12);
    ctx.globalAlpha=on?1:.14;
    const R=this.hover===id?10:7;
    const grad=ctx.createRadialGradient(n.px,n.py,1,n.px,n.py,R*2.4);
    grad.addColorStop(0,disc?m.color:'rgba(169,162,148,.5)'); grad.addColorStop(1,'transparent');
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(n.px,n.py,R*2.4,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(n.px,n.py,R*.55,0,7); ctx.fillStyle=disc?m.color:'#2a2a3e'; ctx.fill();
    if(this.hover===id&&on){ ctx.fillStyle='#f4f0e8'; ctx.font='10px "Archivo Narrow"'; ctx.textAlign='center';
      ctx.fillText((disc?m.name:'???').toUpperCase(),n.px,n.py-14); }
    ctx.globalAlpha=1; });
  this.cv.style.cursor=this.hover?'pointer':'default';
} };
SCREEN_HOOKS.index={enter(){ Constellation.renderRecent(); Constellation.drawRing(); }};
