'use strict';
/* ════════════════════════════════════════════════════════════
   QUESTS — the core loop.
   DISCOVER → SCAN → UNDERSTAND → EXPERIMENT → APPLY → COLLECT → UNLOCK → EXPLORE
   Research arcs · objective tracker · progressive disclosure ·
   Research Core home · mastery pathways · next actions.
   ════════════════════════════════════════════════════════════ */
const ARCS=[
{id:'first', n:'First Light', reward:{xp:300,credits:200},
 done:'The universe is open. Every system of Materidex is now yours.',
 steps:[
  {t:'Identify the structural pattern you observed', hint:'One question — trust your eyes.',
    go(){ Quests.askLatticeQuestion(); }, match:(e,d)=>e==='q-lattice'},
  {t:'Determine how a vacancy defect weakens Graphene', hint:'Run the tensile protocol with defects present.',
    go(){ Lab.setMaterial('graphene'); Lab.setGuided(true); nav('lab');
      Quests.coach('#sim-run','Set defect density, then Run. Watch where failure begins.'); },
    match:(e,d)=>e==='sim-complete'&&d.id==='graphene'},
  {t:'Visit your Collection — Graphene is waiting', hint:'Your first specimen has crystallised.',
    go(){ nav('collection'); }, match:(e,d)=>e==='nav'&&d.to==='collection'},
  {t:'Open the World Atlas and trace the violet signal', hint:'A solar material in Semiconductor Nexus is failing in the field.',
    go(){ nav('atlas'); Quests.coach('#atlas-objective','A perovskite absorber is degrading under tropical conditions. Click the glowing realm, then open the investigation.'); },
    match:(e,d)=>e==='atlas-select'&&d.key==='nexus'},
  {t:'Complete the Perovskite Stability investigation', hint:'Observe · stress · interpret · decide — about four minutes.',
    go(){ nav('expedition'); }, match:(e,d)=>e==='expedition'&&d.success},
  {t:'Inspect the recovered crystal — open its entry', hint:'The anomaly has a name now.',
    go(){ Codex.show('perovskite'); nav('codex'); }, match:(e,d)=>e==='view-material'&&d.id==='perovskite'},
  {t:'Answer the engineering request: can it harvest light?', hint:'Build a quick solar device — Perovskite absorber, Graphene electrode.',
    go(){ openSolar({guided:true}); }, match:(e,d)=>e==='solar-built'},
]},
{id:'carbon', n:'Carbon Awakening', reward:{xp:350,credits:250},
 done:'Carbon mapped in one and two dimensions. The family begins to cohere.',
 steps:[
  {t:'Discover Carbon Nanotube — graphene, rolled', hint:'Find its silhouette in the Material Index and scan it.',
    go(){ nav('index'); $('#idx-search').value='carbon'; Constellation.query='carbon'; Constellation.applyFilters(); },
    match:(e,d)=>e==='discover'&&d.id==='cnt'},
  {t:'Compare Graphene with Carbon Nanotube', hint:'Same bonds, different dimensionality.',
    go(){ S.compareSel=['graphene','cnt']; save(); nav('loadout'); },
    match:(e,d)=>e==='compare'&&d.ids.includes('graphene')&&d.ids.includes('cnt')},
  {t:'Clear the Flexible Wearable Sensor challenge', hint:'A carbon conductor on a soft substrate is a classic answer.',
    go(){ nav('challenges'); setTimeout(()=>CH_OPEN.wearable(),400); },
    match:(e,d)=>e==='challenge'&&d.id==='wearable'&&d.score>=60},
]},
{id:'violet2', n:'The Corroded Frontier', reward:{xp:350,credits:250},
 done:'You have seen what the sea does to ambition. Design against it.',
 steps:[
  {t:'Survey the Metals Foundry', hint:'The Atlas remembers every realm you visit.',
    go(){ nav('atlas'); }, match:(e,d)=>e==='atlas-select'&&d.key==='foundry'},
  {t:'Discover Stainless Steel 316L', hint:'The honest marine default.',
    go(){ nav('index'); }, match:(e,d)=>e==='discover'&&d.id==='steel'},
  {t:'Discover Ti-6Al-4V', hint:'Seawater immunity, at a price.',
    go(){ nav('index'); }, match:(e,d)=>e==='discover'&&d.id==='ti64'},
  {t:'Clear the Marine Structure challenge', hint:'25 years. One bracket. Choose your defence.',
    go(){ CH_OPEN.marine(); }, match:(e,d)=>e==='challenge'&&d.id==='marine'&&d.score>=60},
]},
{id:'memory', n:'Matter That Remembers', reward:{xp:400,credits:300},
 done:'The metal remembered. So will you.',
 steps:[
  {t:'Discover Nitinol', hint:'A Foundry alloy with a memory.',
    go(){ nav('index'); }, match:(e,d)=>e==='discover'&&d.id==='nitinol'},
  {t:'Run a tensile protocol on Nitinol', hint:'Watch superelasticity bend the rules.',
    go(){ if(Lab.setMaterial('nitinol')) nav('lab'); }, match:(e,d)=>e==='sim-complete'&&d.id==='nitinol'},
  {t:'Build the Shape-Memory Valve', hint:'Open at 70 °C. Close on cooling. No motor.',
    go(){ CH_OPEN.actuator(); }, match:(e,d)=>e==='challenge'&&d.id==='actuator'&&d.score>=60},
]},
{id:'living', n:'The Living Material', reward:{xp:400,credits:300},
 done:'The reef gave you materials that decay on schedule — the hardest trick of all.',
 steps:[
  {t:'Survey the Biofabricated Depths', hint:'The living realm.',
    go(){ nav('atlas'); }, match:(e,d)=>e==='atlas-select'&&d.key==='bio'},
  {t:'Discover Hydrogel', hint:'Mostly water, held in a net.',
    go(){ nav('index'); }, match:(e,d)=>e==='discover'&&d.id==='hydrogel'},
  {t:'Discover Cellulose Nanofibre', hint:'Wood, deconstructed.',
    go(){ nav('index'); }, match:(e,d)=>e==='discover'&&d.id==='cellulose'},
  {t:'Clear the Biodegradable Package challenge', hint:'Ship berries 500 km. Then vanish.',
    go(){ CH_OPEN.package(); }, match:(e,d)=>e==='challenge'&&d.id==='package'&&d.score>=60},
]}];

const Quests={
init(){ // migrations
  const all=['core','codex','atlas','index','lab','expedition','collection','loadout','challenges','log','achievements','settings'];
  S.unlocks={}; all.forEach(k=>S.unlocks[k]=1);
  if(!S.arcProgress) S.arcProgress={};
  if(!Object.keys(S.arcProgress).length&&S.arc&&Number.isFinite(S.arcStep)){
    const p=this.progress(ARCS.find(a=>a.id===S.arc));
    for(let i=0;i<S.arcStep;i++) p.done[i]=Date.now();
  }
  if(S.trackedArc===undefined) S.trackedArc=null;
  if(!S.msteps) S.msteps={};
  S.mode='free';
  if(!S.flags) S.flags={};
  this.reconcileExistingProgress();
  this.buildTracker(); this.syncRail(); this.renderTracker(); save(); },
progress(a){ if(!a) return {done:{},rewarded:false};
  S.arcProgress[a.id]=S.arcProgress[a.id]||{done:{},rewarded:false}; return S.arcProgress[a.id]; },
reconcileExistingProgress(){ const mark=(id,i,ok)=>{ if(ok){ const a=ARCS.find(x=>x.id===id); if(a) this.progress(a).done[i]=this.progress(a).done[i]||Date.now(); } };
  const simmed=id=>(S.simResults||[]).some(r=>r.mat===id)||!!(S.msteps[id]&&S.msteps[id].sim);
  mark('first',0,!!S.flags.qlattice); mark('first',1,simmed('graphene'));
  mark('first',3,!!S.regionsVisited.nexus); mark('first',4,(S.expeditionsDone||0)>0);
  mark('first',5,!!S.discovered.perovskite); mark('first',6,!!S.questsDone.solarQuick);
  mark('carbon',0,!!S.discovered.cnt); mark('carbon',1,!!(S.msteps.cnt&&S.msteps.cnt.cmp)); mark('carbon',2,!!S.questsDone.wearable);
  mark('violet2',0,!!S.regionsVisited.foundry); mark('violet2',1,!!S.discovered.steel); mark('violet2',2,!!S.discovered.ti64); mark('violet2',3,!!S.questsDone.marine);
  mark('memory',0,!!S.discovered.nitinol); mark('memory',1,simmed('nitinol')); mark('memory',2,!!S.questsDone.actuator);
  mark('living',0,!!S.regionsVisited.bio); mark('living',1,!!S.discovered.hydrogel); mark('living',2,!!S.discovered.cellulose); mark('living',3,!!S.questsDone.package);
  ARCS.forEach(a=>{ const p=this.progress(a); if(!p.rewarded&&a.steps.every((_,i)=>p.done[i])) this.completeArc(a); }); },
arc(){ return ARCS.find(a=>a.id===S.trackedArc)||null; },
step(){ const a=this.arc(); if(!a) return null; const p=this.progress(a);
  return a.steps.find((_,i)=>!p.done[i])||null; },
stepIndex(a=this.arc()){ if(!a) return -1; const p=this.progress(a); return a.steps.findIndex((_,i)=>!p.done[i]); },
syncRail(){ $$('.rail-btn').forEach(b=>{ b.classList.remove('locked'); b.removeAttribute('aria-disabled'); }); },

trackArc(id){ if(!ARCS.some(a=>a.id===id)) return;
  S.trackedArc=id; S.flags.qtDismissed=false; S.flags.qtOpen=false; save();
  this.renderTracker(); if(typeof Expedition!=='undefined') Expedition.syncTrackButton(); if(CURRENT==='core') renderCore();
  toast(`Expedition tracked — <b>${this.arc().n}</b>`); },
untrackArc(){ const a=this.arc(); S.trackedArc=null; S.flags.qtDismissed=false; S.flags.qtOpen=false; save();
  this.renderTracker(); if(typeof Expedition!=='undefined') Expedition.syncTrackButton(); if(CURRENT==='core') renderCore();
  if(a) toast(`Expedition untracked — ${a.n}`); },
openPicker(){ openModal(`<div class="panel-title">Choose an optional expedition</div><div class="panel-body">
    <p class="tiny dim" style="line-height:1.7;margin-bottom:12px">Track one guide at a time, change it whenever you like, or explore without one. Core tools remain available either way.</p>
    <div class="col" style="gap:8px">${ARCS.map(a=>{ const p=this.progress(a),done=Object.keys(p.done).length;
      return `<button class="evt-choice" data-trackarc="${a.id}"><span>${a.n}</span><small>${done}/${a.steps.length} objectives recognised${p.rewarded?' · complete':''}</small></button>`; }).join('')}</div>
    ${S.trackedArc?'<button class="ctl sm" id="arc-picker-untrack" style="margin-top:12px">Explore without tracking</button>':''}</div>`);
  $$('#modal-box [data-trackarc]').forEach(b=>b.addEventListener('click',()=>{ this.trackArc(b.dataset.trackarc); closeModal(); }));
  const un=$('#arc-picker-untrack'); if(un) un.addEventListener('click',()=>{ this.untrackArc(); closeModal(); }); },

/* ---------- event bus — every system reports here ---------- */
event(type,data={}){
  this.masteryHooks(type,data);
  const hits=[];
  ARCS.forEach(a=>{ const p=this.progress(a);
    a.steps.forEach((st,i)=>{ if(!p.done[i]&&st.match(type,data)){ p.done[i]=Date.now(); hits.push(a); } });
    if(!p.rewarded&&a.steps.every((_,i)=>p.done[i])) this.completeArc(a); });
  [...new Set(hits)].forEach(a=>{ const p=this.progress(a),done=Object.keys(p.done).length;
    Sound.glass(); toast(`<b>Expedition progress recognised</b> — ${a.n} ${done}/${a.steps.length}`,'','spark',4800);
    logEntry(`Optional expedition "${a.n}": ${done}/${a.steps.length} objectives recognised.`,'opal'); });
  this.sideQuests(type,data); save(); this.renderTracker(); if(CURRENT==='core') renderCore(); },
sideQuests(type,d){ // next-action suggestions outside arc matches
  if(type==='discover'&&!this._sugDisc){ this._sugDisc=true;
    this.suggest(`${MATERIALS[d.id].name} verified.`,'Open its entry',()=>{ Codex.show(d.id); nav('codex'); }); }
  if(type==='sim-saved') this.suggest('Result archived.','Apply it in a challenge',()=>nav('challenges')); },
completeArc(a){ const p=this.progress(a); if(p.rewarded) return; p.rewarded=Date.now();
  addXP(a.reward.xp,'· optional expedition complete'); addCredits(a.reward.credits,'· expedition bounty');
  logEntry(`Optional expedition complete — ${a.n}. ${a.done}`,'opal');
  toast(`<b>${a.n} complete</b> — rewards added without interrupting exploration`,'','spark',6200);
  if(S.trackedArc===a.id) S.flags.qtOpen=true;
  save(); },

/* ---------- objective tracker ---------- */
buildTracker(){ if($('#quest-tracker')) return;
  const el=document.createElement('div'); el.id='quest-tracker';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{ if(e.target.closest('#qt-go')){ const st=this.step(); if(st) st.go(); }
    else if(e.target.closest('#qt-toggle')){ S.flags.qtOpen=!S.flags.qtOpen; save(); this.renderTracker(); }
    else if(e.target.closest('#qt-dismiss')){ S.flags.qtDismissed=true; save(); this.renderTracker(); toast('Expedition indicator hidden — manage it from the Research Core.'); }
    else if(e.target.closest('#qt-untrack')) this.untrackArc();
    else if(e.target.closest('#qt-change')) this.openPicker(); }); },
renderTracker(){ const el=$('#quest-tracker'); if(!el) return;
  const a=this.arc(), st=this.step(); if(!a||S.flags.qtDismissed){ el.style.display='none'; return; }
  const p=this.progress(a),done=Object.keys(p.done).length,idx=this.stepIndex(a);
  el.style.display='block';
  if(!S.flags.qtOpen){ el.innerHTML=`<button id="qt-toggle" class="qt-chip" title="${esc(st?st.t:a.done)}">◈ ${a.n} · ${done}/${a.steps.length}</button>`; return; }
  el.innerHTML=`<div class="qt-card">
    <div class="row" style="justify-content:space-between">
      <span class="eyebrow" style="letter-spacing:.26em">Optional expedition — ${a.n}</span>
      <button id="qt-toggle" class="tiny dim" style="letter-spacing:.1em">collapse</button></div>
    <div class="qt-step"><b>${p.rewarded?'COMPLETE':(idx+1)+'/'+a.steps.length}</b> ${st?st.t:a.done}</div>
    <div class="row" style="justify-content:space-between;margin-top:8px">
      <span class="tiny dim" style="max-width:58%">${st?st.hint:'Rewards collected automatically.'}</span>
      ${st?'<button class="ctl sm" id="qt-go">Go</button>':''}</div>
    <div class="row" style="gap:12px;margin-top:10px"><button class="tiny dim" id="qt-change">change</button>
      <button class="tiny dim" id="qt-untrack">untrack</button><button class="tiny dim" id="qt-dismiss">dismiss</button></div></div>`; },
suggest(text,btn,fn){ let el=$('#next-action');
  if(!el){ el=document.createElement('div'); el.id='next-action'; document.body.appendChild(el); }
  el.innerHTML=`<div class="qt-card" style="pointer-events:auto">
    <div class="row" style="justify-content:space-between;gap:10px">
      <span style="font-size:12px">${text}</span>
      <button class="ctl sm primary" id="na-go">${btn}</button>
      <button id="na-x" class="dim" style="font-size:12px">✕</button></div></div>`;
  el.style.display='block';
  $('#na-go').addEventListener('click',()=>{ el.style.display='none'; fn(); });
  $('#na-x').addEventListener('click',()=>el.style.display='none');
  clearTimeout(this._naT); this._naT=setTimeout(()=>{ if(el) el.style.display='none'; },14000); },
coach(sel,text){ $$('.coach-tip').forEach(e=>e.remove());
  const target=$(sel); if(!target) return;
  const tip=document.createElement('div'); tip.className='coach-tip';
  tip.innerHTML=`<span>${text}</span>`;
  document.body.appendChild(tip);
  const r=target.getBoundingClientRect();
  tip.style.left=clamp(r.left+r.width/2-130,10,innerWidth-280)+'px';
  tip.style.top=clamp(r.top-70,10,innerHeight-90)+'px';
  target.classList.add('coach-ring');
  const clear=()=>{ tip.remove(); target.classList.remove('coach-ring');
    document.removeEventListener('pointerdown',clear); };
  setTimeout(()=>document.addEventListener('pointerdown',clear),400);
  setTimeout(clear,12000); },

/* ---------- onboarding stage 3.5 — observation question ---------- */
askLatticeQuestion(){ openModal(`<div class="panel-title">Observation</div><div class="panel-body">
  <h2 class="display" style="font-size:28px">What structural pattern did you observe?</h2>
  <p class="tiny dim" style="margin:8px 0 16px">There is no trick — trust what you saw resolve.</p>
  <div class="col" style="gap:8px">
    <button class="evt-choice" data-q="hex"><span>Hexagonal network</span><small>six-sided rings</small></button>
    <button class="evt-choice" data-q="cubic"><span>Cubic lattice</span><small>square cells</small></button>
    <button class="evt-choice" data-q="amorph"><span>Random amorphous network</span><small>no repeating order</small></button></div></div>`);
  $$('#modal-box [data-q]').forEach(b=>b.addEventListener('click',()=>{ closeModal();
    if(b.dataset.q==='hex'){ Sound.discover(); addXP(60,'· structural observation confirmed');
      toast('Correct — every carbon binds three neighbours in hexagonal rings.','','spark',5200); }
    else toast('Look again at the entry — six-sided rings, every atom bonded to three neighbours. That hexagonal network is the answer.','','hex',6200);
    S.flags.qlattice=true; save();
    this.event('q-lattice',{}); })); },

/* ---------- mastery pathway ---------- */
masteryHooks(type,d){ const ms=(id)=>{ S.msteps[id]=S.msteps[id]||{}; return S.msteps[id]; };
  if(type==='view-material') ms(d.id).view=1;
  if(type==='datasheet') ms(d.id).bond=1;
  if(type==='sim-complete') ms(d.id).sim=1;
  if(type==='compare') d.ids.forEach(id=>{ if(MATERIALS[id]) ms(id).cmp=1; });
  if(type==='loadout-assign') ms(d.id).apply=1;
  if(type==='defect-inspect') ms(d.id).defect=1; },
masteryPathHTML(id){ const m=S.msteps[id]||{};
  const steps=[['Discover',!!S.discovered[id]],['Scan structure',(S.mastery[id]||0)>0],
    ['Inspect bonding (datasheet)',!!m.bond],['Run a Lab protocol',!!m.sim],
    ['Compare with another material',!!m.cmp],['Apply in a loadout or challenge',!!m.apply||!!Object.values(S.loadoutSlots||{}).includes(id)],
    ['Mastery question',!!m.quiz]];
  return `<div class="eyebrow" style="margin:12px 0 6px">Mastery pathway</div>`+
    steps.map(([t,done],i)=>`<div class="mpath-step ${done?'done':''}" ${i===6&&!done?'data-mq="'+id+'"':''}>
      <i>${done?'✦':'◇'}</i><span>${t}</span></div>`).join(''); },
wireMasteryPath(id){ const el=$(`[data-mq="${id}"]`); if(!el) return;
  el.style.cursor='pointer';
  el.addEventListener('click',()=>this.masteryQuiz(id)); },
masteryQuiz(id){ const m=MATERIALS[id];
  const correct=m.bonding.structure;
  const wrongs=MAT_LIST.filter(x=>x!==id&&MATERIALS[x].bonding.structure!==correct).slice(0,8);
  const opts=[correct, MATERIALS[wrongs[0]].bonding.structure, MATERIALS[wrongs[3]||wrongs[1]].bonding.structure]
    .sort(()=>Math.random()-.5);
  openModal(`<div class="panel-title">Mastery question — ${m.name}</div><div class="panel-body">
    <h3 class="display" style="font-size:24px">Which structure does ${m.name} take?</h3>
    <div class="col" style="gap:8px;margin-top:14px">${opts.map(o=>
      `<button class="evt-choice" data-mqa="${esc(o)}"><span>${o}</span></button>`).join('')}</div></div>`);
  $$('#modal-box [data-mqa]').forEach(b=>b.addEventListener('click',()=>{ closeModal();
    if(b.dataset.mqa===correct){ Sound.discover(); S.msteps[id]=S.msteps[id]||{}; S.msteps[id].quiz=1;
      addMastery(id,80); addXP(80,'· mastery verified'); save();
      toast(`<b>${m.name} mastery advanced</b> — structure verified`,'','spark');
      if(CURRENT==='codex') Codex.refreshPanels(); }
    else toast('Not quite — revisit the Bonding & Structure panel.','verm','alert'); })); },
};

/* ---------- RESEARCH CORE home screen ---------- */
function renderCore(){ const el=$('#core-body'); if(!el) return;
  const a=Quests.arc(), st=Quests.step();
  const ap=a?Quests.progress(a):null;
  const nDisc=Object.keys(S.discovered).length;
  const {r,next}=rankOf(S.xp);
  const recent=S.log.slice(0,3);
  const lastDisc=Object.entries(S.discovered).sort((x,y)=>y[1]-x[1])[0];
  const nearSet=SETS.map(s=>({s,have:s.ids.filter(id=>S.discovered[id]).length}))
    .filter(x=>x.have<x.s.ids.length).sort((x,y)=>(y.have/y.s.ids.length)-(x.have/x.s.ids.length))[0];
  const trackedIds=Object.keys(S.tracked||{}).filter(k=>S.tracked[k]);
  el.innerHTML=`
  <div id="core-hero" class="panel">
    <div class="panel-body" style="padding:26px 28px 24px">
      <div class="eyebrow" style="margin-bottom:10px">${a? 'Optional expedition tracked — '+a.n : 'Open exploration'}</div>
      <h2 class="display" style="font-size:clamp(24px,2.6vw,34px);line-height:1.25;max-width:600px">${st? st.t : a? a.done : 'Every core instrument is ready. Follow your curiosity in any direction.'}</h2>
      ${st?`<p class="tiny dim" style="margin:10px 0 16px">${st.hint||''} Progress is recognised even when you explore elsewhere.</p>`:''}
      <div class="row wrap" style="gap:10px;margin-top:14px">
        ${st?'<button class="ctl" id="core-go">Continue expedition</button>':''}
        <button class="ctl primary" data-nav-go="index">Explore the Index</button>
        <button class="ctl primary" data-nav-go="atlas">Open the Atlas</button>
        <button class="ctl" id="core-expeditions">${a?'Change expedition':'Begin an expedition'}</button>
        ${a&&S.flags.qtDismissed?'<button class="ctl sm" id="core-showtracker">Show expedition indicator</button>':''}
        ${a?`<span class="tiny dim">${Object.keys(ap.done).length} of ${a.steps.length} recognised${ap.rewarded?' · complete':''}</span>`:''}</div>
    </div></div>
  <div id="core-grid">
    <div class="panel lens"><div class="panel-title">Research standing</div><div class="panel-body">
      <div class="kv"><span>Rank</span><b>${r.n}</b></div>
      <div class="kv"><span>XP</span><b>${fmt(S.xp)}${next?' / '+fmt(next.xp):''}</b></div>
      <div class="kv"><span>Collection</span><b>${nDisc} / ${MAT_LIST.length}</b></div>
      <div class="kv"><span>Realms surveyed</span><b>${Object.keys(S.regionsVisited||{}).length} / 6</b></div>
    </div></div>
    <div class="panel lens"><div class="panel-title">Recent discovery</div><div class="panel-body">
      ${lastDisc?`<div class="row" style="gap:12px">
        <div style="width:44px;height:44px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 30%,#fff3,${MATERIALS[lastDisc[0]].color} 45%,#0007 130%);box-shadow:0 0 16px ${MATERIALS[lastDisc[0]].color}66"></div>
        <div><b style="letter-spacing:.14em;font-size:12px">${MATERIALS[lastDisc[0]].name.toUpperCase()}</b><br>
        <span class="tiny dim">${new Date(lastDisc[1]).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span></div></div>
      <button class="ctl sm" style="margin-top:12px" id="core-lastdisc">Open entry</button>`
      :'<p class="tiny dim">Nothing yet — scan your first specimen.</p>'}
    </div></div>
    <div class="panel lens"><div class="panel-title">Passive progression</div><div class="panel-body">
      ${next?`<div class="setline"><div class="sl-top"><span>${next.n}</span><b>${fmt(next.xp-S.xp)} XP away</b></div>
        <div class="tr"><i style="width:${(S.xp-r.xp)/(next.xp-r.xp)*100}%"></i></div></div>`:''}
      ${nearSet?`<div class="setline"><div class="sl-top"><span>${nearSet.s.n} set</span><b>${nearSet.have}/${nearSet.s.ids.length}</b></div>
        <div class="tr"><i style="width:${nearSet.have/nearSet.s.ids.length*100}%"></i></div>
        <p class="tiny dim" style="margin-top:4px">${nearSet.s.bonus}</p></div>`:''}
    </div></div>
    <div class="panel lens"><div class="panel-title">Quick actions</div><div class="panel-body">
      <div class="ctl-group">
        <button class="ctl sm" id="core-quicklab">Quick lab</button>
        <button class="ctl sm" data-nav-go="index">Index</button>
        <button class="ctl sm" data-nav-go="atlas">Atlas</button>
        <button class="ctl sm" data-nav-go="expedition">Expeditions</button>
        ${trackedIds.length?`<button class="ctl sm" id="core-tracked">Tracked: ${MATERIALS[trackedIds[0]].name}</button>`:''}</div>
      <p class="tiny dim" style="margin-top:12px;line-height:1.6">Discoveries, simulations, comparisons and challenges advance relevant expeditions automatically. Tracking is optional.</p>
    </div></div>
    <div class="panel lens" style="grid-column:1/-1"><div class="panel-title">Research log — latest</div><div class="panel-body">
      ${recent.length? recent.map(l=>`<div class="logline ${l.kind}"><span class="lt">${new Date(l.t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span><span class="lk"></span><span>${l.text}</span></div>`).join('')
        : '<p class="tiny dim">The log is empty. Scan something.</p>'}
    </div></div>
  </div>`;
  const go=$('#core-go'); if(go) go.addEventListener('click',()=>{ const s2=Quests.step(); if(s2) s2.go(); });
  const ex=$('#core-expeditions'); if(ex) ex.addEventListener('click',()=>Quests.openPicker());
  const show=$('#core-showtracker'); if(show) show.addEventListener('click',()=>{ S.flags.qtDismissed=false; save(); Quests.renderTracker(); renderCore(); });
  const ql=$('#core-quicklab'); if(ql) ql.addEventListener('click',()=>nav('lab'));
  const ld=$('#core-lastdisc'); if(ld&&lastDisc) ld.addEventListener('click',()=>{ Codex.show(lastDisc[0]); nav('codex'); });
  const tr=$('#core-tracked'); if(tr&&trackedIds.length) tr.addEventListener('click',()=>{ Codex.show(trackedIds[0]); nav('codex'); }); }
SCREEN_HOOKS.core={enter(){ renderCore(); }};

window.Quests=Quests;
window.renderCore=renderCore;
