/* ════════════════ COMPARE + LOADOUT ════════════════ */
const SLOTS=[
  {id:'nose',   n:'Nose',           mass:180, poly:'30,96 108,64 190,58 190,132 108,128', lx:60, ly:100},
  {id:'skin',   n:'Skin',           mass:640, poly:'194,52 470,42 470,148 194,138', lx:300, ly:66},
  {id:'frame',  n:'Frame',          mass:520, poly:'240,74 440,70 440,120 240,124', lx:322, ly:100},
  {id:'shield', n:'Thermal Shield', mass:260, poly:'474,40 640,54 640,138 474,150', lx:530, ly:100},
  {id:'joints', n:'Joints',         mass:110, poly:'644,58 730,78 762,96 730,116 644,134', lx:690, ly:100},
];
const BASELINE_RHO=4430; // all-Ti baseline
const CMP_ROWS=[
  ['Specific strength', m=>m.load.sigma/m.load.rho, v=>(v).toFixed(2)+' kN·m/kg', true],
  ['Stiffness', m=>m.load.E, v=>v>=1?v.toFixed(0)+' GPa':(v*1000).toFixed(1)+' MPa', true],
  ['Density', m=>m.load.rho, v=>(v/1000).toFixed(2)+' g/cm³', false],
  ['Fatigue resistance', m=>m.load.fatigue, v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v)), true],
  ['Temp window', m=>m.load.tmax-m.load.tmin, v=>v.toFixed(0)+' °C span', true],
  ['Corrosion', m=>m.load.corr, v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v)), true],
  ['Repairability', m=>m.load.repair, v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v)), true],
  ['Cost', m=>m.load.costkg, v=>'$'+v.toFixed(1)+'/kg', false],
  ['Embodied carbon', m=>m.load.co2, v=>v.toFixed(1)+' kgCO₂e/kg', false],
  ['Recyclability', m=>m.load.recy, v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v)), true],
];
const Loadout={ risks:[],
init(){
  if(!Object.keys(S.loadoutSlots).length) S.loadoutSlots={nose:'ti64',skin:'cfrp',frame:'ti64',shield:'alli'};
  this.buildAirframe(); this.renderShelf(); this.renderTray(); this.renderCompare(); this.recalc();
  const radarWrap=$('#radar-wrap');
  if(window.ResizeObserver&&radarWrap){
    this.radarObserver=new ResizeObserver(()=>requestAnimationFrame(()=>this.drawCompareRadar()));
    this.radarObserver.observe(radarWrap);
  } else window.addEventListener('resize',()=>this.drawCompareRadar());
  $('#lo-test').addEventListener('click',()=>this.test());
  $('#lo-save').addEventListener('click',()=>this.saveConfig());
  $('#lo-submit').addEventListener('click',()=>this.submit());
},
addCompare(id){ if(!S.compareSel.includes(id)){ S.compareSel=[id,...S.compareSel].slice(0,3); save(); }
  this.renderTray(); this.renderCompare(); },
shelfAdd(id){ toast(`${MATERIALS[id].name} staged on the loadout shelf — drag it onto a component`); this.renderShelf(id); },
buildAirframe(){ const wrap=$('#airframe-wrap');
  if(!document.getElementById('lo-anim-style')){ const stl=document.createElement('style'); stl.id='lo-anim-style';
    stl.textContent='@keyframes snapPulse{0%{stroke-width:4;filter:drop-shadow(0 0 16px rgba(147,220,244,.95))}100%{stroke-width:1;filter:none}} .lo-slot-poly.snap{animation:snapPulse .7s cubic-bezier(.16,1,.3,1)}';
    document.head.appendChild(stl); }
  wrap.innerHTML=`<svg id="airframe-svg" viewBox="0 0 800 200" role="group" aria-label="Airframe slots">
    <defs>
      <linearGradient id="hullG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(255,255,255,.16)"/>
        <stop offset=".28" stop-color="rgba(200,204,220,.09)"/>
        <stop offset=".62" stop-color="rgba(60,58,100,.08)"/>
        <stop offset="1" stop-color="rgba(139,108,240,.07)"/>
      </linearGradient>
      <linearGradient id="specline" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="transparent"/><stop offset=".5" stop-color="rgba(255,255,255,.55)"/><stop offset="1" stop-color="transparent"/>
      </linearGradient>
      <pattern id="pat-weave" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="rgba(24,26,36,.95)"/>
        <rect width="4" height="8" fill="rgba(74,78,102,.9)"/>
        <rect y="4" width="8" height="1.6" fill="rgba(12,13,20,.9)"/>
      </pattern>
      <pattern id="pat-brushed" width="12" height="3.2" patternUnits="userSpaceOnUse">
        <rect width="12" height="3.2" fill="rgba(128,134,156,.5)"/>
        <rect width="12" height="1" fill="rgba(224,228,242,.5)"/>
        <rect y="2.4" width="12" height=".6" fill="rgba(40,42,56,.6)"/>
      </pattern>
      <pattern id="pat-facet" width="14" height="12" patternUnits="userSpaceOnUse">
        <rect width="14" height="12" fill="rgba(206,202,188,.24)"/>
        <path d="M0 12L7 0l7 12z" fill="rgba(240,238,228,.22)" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>
      </pattern>
      <pattern id="pat-soft" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="rgba(110,180,140,.2)"/>
        <circle cx="5" cy="5" r="2.6" fill="rgba(160,225,185,.28)"/>
      </pattern>
    </defs>
    <path d="M18,96 Q60,54 120,50 L470,40 Q560,40 650,56 L735,78 Q775,90 762,96 Q775,102 735,114 L650,136 Q560,152 470,150 L120,142 Q60,138 18,96 Z"
      fill="url(#hullG)" stroke="rgba(205,188,247,.35)" stroke-width="1"/>
    <path d="M300,42 L250,6 L330,6 L360,41 Z" fill="rgba(244,240,232,.05)" stroke="rgba(205,188,247,.25)"/>
    <path d="M300,150 L250,192 L330,192 L360,151 Z" fill="rgba(244,240,232,.05)" stroke="rgba(205,188,247,.25)"/>
    <g id="af-skeleton" stroke="rgba(120,110,180,.28)" fill="none" stroke-width="1">
      <path d="M120,60 L120,132 M180,55 L180,138 M240,52 L240,140 M300,49 L300,143 M360,46 L360,146 M420,45 L420,147 M470,44 L470,148 M530,50 L530,143 M600,56 L600,137 M660,62 L660,131"/>
      <path d="M100,96 L740,96" stroke-dasharray="2 5"/>
    </g>
    <rect x="120" y="43" width="350" height="1.4" fill="url(#specline)" opacity=".8"/>
    <ellipse cx="770" cy="96" rx="9" ry="5" fill="rgba(147,220,244,.75)">
      <animate attributeName="opacity" values=".45;.9;.45" dur="2.2s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="781" cy="96" rx="16" ry="3" fill="rgba(147,220,244,.28)">
      <animate attributeName="rx" values="14;22;14" dur="2.2s" repeatCount="indefinite"/>
    </ellipse>
    ${SLOTS.map(s=>`<polygon class="lo-slot-poly" data-slot="${s.id}" points="${s.poly}"><title>${s.n}</title></polygon>
      <text class="lo-slot-label" x="${s.lx}" y="${s.ly-14}" text-anchor="middle">${s.n.toUpperCase()}</text>
      <text class="lo-slot-mat" x="${s.lx}" y="${s.ly+2}" text-anchor="middle" data-slotlabel="${s.id}">— empty —</text>`).join('')}
  </svg>`;
  $$('.lo-slot-poly').forEach(p=>{
    p.addEventListener('click',()=>this.slotPicker(p.dataset.slot));
    p.addEventListener('dragover',e=>{ e.preventDefault(); p.classList.add('dragover'); });
    p.addEventListener('dragleave',()=>p.classList.remove('dragover'));
    p.addEventListener('drop',e=>{ e.preventDefault(); p.classList.remove('dragover');
      const id=e.dataTransfer.getData('text/mat'); if(id) this.assign(p.dataset.slot,id); }); });
  this.syncSlots(); },
syncSlots(){ const CAT={cfrp:'weave',kevlar:'weave',cnt:'weave',cellulose:'weave',graphene:'weave',
    ti64:'brushed',steel:'brushed',alli:'brushed',nitinol:'brushed',liquidmetal:'brushed',mxene:'brushed',
    sic:'facet',alumina:'facet',zirconia:'facet',glass:'facet',diamond:'facet',silicon:'facet',gaas:'facet',perovskite:'facet',aerogel:'facet',
    pla:'soft',peek:'soft',silicone:'soft',hydrogel:'soft',mycelium:'soft',pedot:'soft'};
  SLOTS.forEach(s=>{ const id=S.loadoutSlots[s.id];
    const lbl=$(`[data-slotlabel="${s.id}"]`), poly=$(`.lo-slot-poly[data-slot="${s.id}"]`);
    if(lbl) lbl.textContent=id? MATERIALS[id].name : '— empty —';
    if(poly){ poly.classList.toggle('filled',!!id);
      if(id){ const cat=CAT[id];
        poly.style.fill= cat? `url(#pat-${cat})` : MATERIALS[id].color+'2e';
        poly.style.stroke=MATERIALS[id].color+'aa'; }
      else{ poly.style.fill=''; poly.style.stroke=''; } } });
  const sk=document.getElementById('af-skeleton');
  if(sk) sk.setAttribute('stroke', S.loadoutSlots.frame? MATERIALS[S.loadoutSlots.frame].color+'99' : 'rgba(120,110,180,.28)'); },
assign(slot,id){ S.loadoutSlots[slot]=id; delete S.mitigations[this.riskKey('cfrp','ti64')]; // re-eval risk on change
  save(); Sound.snap(); this.syncSlots(); this.recalc();
  if(window.Quests&&Quests.event) Quests.event('loadout-assign',{id});
  const poly=$(`.lo-slot-poly[data-slot="${slot}"]`);
  if(poly){ poly.classList.remove('snap'); poly.getBoundingClientRect(); poly.classList.add('snap');
    setTimeout(()=>poly.classList.remove('snap'),750); }
  toast(`${MATERIALS[id].name} → ${SLOTS.find(s=>s.id===slot).n}`); },
slotPicker(slot){ const s=SLOTS.find(x=>x.id===slot);
  const opts=MAT_LIST.filter(id=>MATERIALS[id].load&&MATERIALS[id].load.sigma>5);
  openModal(`<div class="panel-title">Assign material — ${s.n}</div><div class="panel-body">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">
    ${opts.map(id=>{ const m=MATERIALS[id]; const d=S.discovered[id];
      return `<button class="rel-card" data-pick="${id}" ${d?'':'disabled style="opacity:.35"'}>
        <div class="sw" style="background:radial-gradient(circle at 35% 30%,#fff2,${m.color} 45%,#0007 130%)"></div>
        <span>${d?m.name:'??? undiscovered'}</span>
        <small class="mono dim" style="font-size:8px">${(m.load.rho/1000).toFixed(2)} g/cm³</small></button>`; }).join('')}</div>
    <div class="row" style="margin-top:14px;justify-content:space-between">
      <p class="tiny dim">Undiscovered materials must be scanned before use.</p>
      <button class="ctl sm danger" data-pick="__clear">Clear slot</button></div></div>`);
  $$('#modal-box [data-pick]').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.pick;
    if(id==='__clear'){ delete S.loadoutSlots[slot]; save(); this.syncSlots(); this.recalc(); }
    else this.assign(slot,id);
    closeModal(); })); },
renderShelf(hl){ const shelf=$('#mat-shelf');
  const ids=MAT_LIST.filter(id=>S.discovered[id]&&MATERIALS[id].load);
  shelf.innerHTML= ids.length? ids.map(id=>{ const m=MATERIALS[id];
    return `<div class="shelf-item ${hl===id?'sel':''}" draggable="true" data-shelf="${id}" title="${m.name} — drag onto a slot">
      <div class="sw" style="background:radial-gradient(circle at 35% 30%,#fff2,${m.color} 45%,#0007 130%);box-shadow:0 0 12px ${m.color}55"></div>
      <span>${m.name}</span></div>`; }).join('') : '<p class="tiny dim">Scan materials to stock the shelf.</p>';
  $$('#mat-shelf [data-shelf]').forEach(el=>{
    el.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/mat',el.dataset.shelf); el.classList.add('dragging'); Sound.hover(); });
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
    el.addEventListener('click',()=>this.addCompare(el.dataset.shelf)); }); },
riskKey(a,b){ return [a,b].sort().join('+'); },
detectRisks(){ const used=Object.entries(S.loadoutSlots).filter(([k,v])=>v);
  const risks=[];
  const has=id=>used.some(([k,v])=>v===id);
  if(has('cfrp')&&(has('ti64')||has('alli')||has('steel'))){
    const partner=has('alli')?'alli':has('steel')?'steel':'ti64';
    const key=this.riskKey('cfrp',partner);
    const sev = partner==='alli'?'high':'moderate';
    risks.push({key, level: S.mitigations[key]?'mitigated':sev,
      text:`Galvanic corrosion risk at CFRP–${MATERIALS[partner].name} interface. Carbon is strongly cathodic; in the presence of an electrolyte the ${partner==='ti64'?'titanium remains largely resistant, but fastener zones stay vulnerable':'metal will corrode preferentially at the joint'}.`,
      pair:['cfrp',partner]}); }
  used.forEach(([slot,id])=>{ const m=MATERIALS[id];
    if(slot==='shield'&&m.load.tmax<300) risks.push({key:'thermal-'+id,level:'high',
      text:`${m.name} on the thermal shield: service ceiling ${m.load.tmax} °C is below re-entry skin temperatures.`,noMit:true});
    if(slot!=='shield'&&m.load.tmax<120) risks.push({key:'temp-'+slot,level:'moderate',
      text:`${m.name} in the ${SLOTS.find(s=>s.id===slot).n} approaches its ${m.load.tmax} °C limit under aerodynamic heating.`,noMit:true});
    if(m.load.sigma<50&&slot!=='shield') risks.push({key:'weak-'+slot,level:'high',
      text:`${m.name} lacks structural strength for the ${SLOTS.find(s=>s.id===slot).n} (${m.load.sigma} MPa).`,noMit:true}); });
  this.risks=risks; return risks; },
recalc(){ const used=SLOTS.map(s=>({s,m:S.loadoutSlots[s.id]?MATERIALS[S.loadoutSlots[s.id]]:null}));
  let mass=0, baseMass=0, cost=0, co2=0, minT=1/0,maxT=-1/0, stiff=0, marg=0, nUsed=0;
  used.forEach(({s,m})=>{ baseMass+=s.mass;
    if(!m){ mass+=s.mass; return; } nUsed++;
    const scale=m.load.rho/BASELINE_RHO; const compMass=s.mass*scale;
    mass+=compMass; cost+=compMass*m.load.costkg; co2+=compMass*m.load.co2;
    minT=Math.min(minT,m.load.tmax); maxT=Math.max(maxT,m.load.tmin);
    stiff+=m.load.E; marg+= (m.load.sigma/m.load.rho)/ (950/4430); });
  const massRed=(1-mass/baseMass)*100;
  const safety= nUsed? (marg/nUsed) : 1;
  const sustain= nUsed? clamp(100-co2/14,0,100) : 0;
  const risks=this.detectRisks();
  const unres=risks.filter(r=>r.level!=='mitigated');
  let score= nUsed<4? 2 : clamp(4 + massRed*.14 + (safety-1)*3 + sustain*.02 - unres.length*1.4,0,10);
  this.outcome={mass,massRed,safety,cost,co2,sustain,score,minT,unres:unres.length,nUsed};
  // outcomes panel
  const P=$('#lo-outcomes');
  P.innerHTML=`
    <div class="pred"><span>Mass reduction</span><b class="${massRed>0?'down':'bad'}">${massRed>=0?'▼':'▲'} ${Math.abs(massRed).toFixed(1)}%<small class="dim"> (${mass.toFixed(0)} kg)</small></b></div>
    <div class="pred"><span>Safety margin</span><b class="${safety>=1?'up':'bad'}">${safety>=1?'▲':'▼'} ${((safety-1)*100).toFixed(1)}%</b></div>
    <div class="pred"><span>Cost estimate</span><b>$${(cost/1000).toFixed(1)}k</b></div>
    <div class="pred"><span>Sustainability</span><b class="${sustain>50?'up':''}">${sustain.toFixed(0)} / 100</b></div>
    <div class="pred"><span>Temp ceiling (weakest)</span><b class="${minT<300?'bad':''}">${isFinite(minT)?minT+' °C':'—'}</b></div>
    <div class="pred"><span>Mission score</span><b style="font-size:19px;color:${score>=7?'var(--green)':score>=4?'var(--gold)':'var(--verm)'}">${score.toFixed(1)} / 10</b></div>
    <p class="tiny dim" style="margin-top:8px">Calculated estimates from representative data — mass scales each component by density against the all-titanium baseline.</p>`;
  // compat panel
  $('#lo-compat').innerHTML= risks.length? risks.map(r=>`<div class="kv"><span style="max-width:70%">${r.pair? r.pair.map(p=>MATERIALS[p].name).join(' – ') : r.text.split(':')[0]}</span>
      <b style="color:${r.level==='mitigated'?'var(--green)':r.level==='high'?'var(--verm)':'var(--gold)'}">${r.level.toUpperCase()}</b></div>`).join('')
    : '<div class="kv"><span>All interfaces</span><b style="color:var(--green)">OPTIMAL</b></div>';
  // warning + mitigation
  const galv=risks.find(r=>r.pair&&r.level!=='mitigated');
  $$('.lo-slot-poly').forEach(p=>{ const sid=S.loadoutSlots[p.dataset.slot];
    p.classList.toggle('riskglow', !!(galv&&sid&&galv.pair.includes(sid))); });
  const wbox=$('#lo-warning');
  if(galv){ wbox.style.display='block';
    $('#lo-warning-text').innerHTML=`<b style="letter-spacing:.2em">TRADE-OFF DETECTED</b><br>${galv.text}`;
    const MIT=[
      {t:'Isolate interface (polymer barrier)',s:'+0.4 kg glass-fibre ply per joint · fully blocks the couple',cost:120},
      {t:'Conversion coating (anodise Ti)',s:'thickens oxide; slows but does not stop attack',cost:60},
      {t:'Sacrificial layer (Zn/Ni plating)',s:'the plating corrodes instead — scheduled replacement',cost:40},
      {t:'Accept risk (no mitigation)',s:'score penalty · inspection burden on the operator',cost:0}];
    $('#lo-mitig').innerHTML=MIT.map((m,i)=>`<button data-mit="${i}"><span>${m.t}</span><small>${m.s}${m.cost?' · '+m.cost+' credits':''}</small></button>`).join('');
    $$('#lo-mitig [data-mit]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.mit;
      if(i<3){ if(MIT[i].cost&&!spendCredits(MIT[i].cost)) return;
        S.mitigations[galv.key]=MIT[i].t; save(); grant('iface_arch'); Sound.snap();
        toast('Interface mitigated — '+MIT[i].t); logEntry(`Interface risk mitigated: ${MIT[i].t}.`);
        this.recalc(); }
      else{ S.mitigations[galv.key]=false; b.classList.add('picked');
        toast('Risk accepted — the mission score will carry it','verm','alert'); } })); }
  else wbox.style.display='none'; },
renderTray(){ const tray=$('#compare-tray');
  tray.innerHTML=[0,1,2].map(i=>{ const id=S.compareSel[i];
    if(!id||!MATERIALS[id]) return `<div class="cmp-slot" data-ci="${i}"><span class="dim" style="font-size:22px">+</span><b class="dim">Add material</b></div>`;
    const m=MATERIALS[id];
    return `<div class="cmp-slot filled" data-ci="${i}">
      <button class="rm" data-crm="${i}" aria-label="Remove">✕</button>
      <div class="sw" style="background:radial-gradient(circle at 35% 30%,#fff3,${m.color} 45%,#0008 130%);box-shadow:0 0 18px ${m.color}66"></div>
      <b>${m.name}</b><span class="mono tiny dim">${m.code}</span></div>`; }).join('');
  $$('#compare-tray [data-ci]').forEach(sl=>sl.addEventListener('click',e=>{ if(e.target.closest('.rm')) return;
    this.comparePicker(+sl.dataset.ci); }));
  $$('#compare-tray [data-crm]').forEach(b=>b.addEventListener('click',()=>{ S.compareSel.splice(+b.dataset.crm,1); save();
    this.renderTray(); this.renderCompare(); })); },
comparePicker(i){ const opts=MAT_LIST.filter(id=>S.discovered[id]);
  openModal(`<div class="panel-title">Comparison slot ${i+1}</div><div class="panel-body">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">
    ${opts.map(id=>{ const m=MATERIALS[id]; return `<button class="rel-card" data-cp="${id}">
      <div class="sw" style="background:radial-gradient(circle at 35% 30%,#fff2,${m.color} 45%,#0007 130%)"></div>
      <span>${m.name}</span></button>`; }).join('')}</div></div>`);
  $$('#modal-box [data-cp]').forEach(b=>b.addEventListener('click',()=>{ S.compareSel[i]=b.dataset.cp;
    S.compareSel=[...new Set(S.compareSel)]; save(); closeModal(); this.renderTray(); this.renderCompare(); })); },
drawCompareRadar(){ const cv=$('#cmp-radar'); if(!cv||!cv.clientWidth||!cv.clientHeight) return;
  const ids=S.compareSel.filter(id=>MATERIALS[id]);
  drawRadar(cv,ids.map(id=>({radar:MATERIALS[id].radar,color:MATERIALS[id].color}))); },
renderCompare(){ const ids=S.compareSel.filter(id=>MATERIALS[id]);
  if(window.Quests&&Quests.event&&ids.length>=2) Quests.event('compare',{ids});
  this.drawCompareRadar();
  const tb=$('#cmp-table');
  tb.innerHTML=`<tr><th>Property</th>${ids.map(id=>`<th style="color:${MATERIALS[id].color}">${MATERIALS[id].name}</th>`).join('')}</tr>`+
    CMP_ROWS.map(([label,fn,fmtf,hiGood])=>{ const vals=ids.map(id=>fn(MATERIALS[id]));
      const best= hiGood? Math.max(...vals) : Math.min(...vals);
      return `<tr><td>${label}</td>${vals.map(v=>`<td class="${v===best&&ids.length>1?'best':''}">${fmtf(v)}</td>`).join('')}</tr>`; }).join(''); },
test(){ this.recalc(); const o=this.outcome; Sound.glass();
  const verdict= o.nUsed<4? 'Incomplete — assign at least nose, skin, frame and shield before a meaningful test.' :
    o.unres? `Structurally ${o.safety>=1?'sound':'marginal'}, but ${o.unres} unresolved interface/thermal ${o.unres>1?'risks':'risk'} would fail certification.` :
    o.safety>=1? 'All load paths close. Certification-track configuration.' : 'Safety margin below unity — the shell yields under limit load.';
  openModal(`<div class="panel-title">Loadout test — simulated</div><div class="panel-body">
    <h3 class="display" style="font-size:28px">Mission score ${o.score.toFixed(1)} / 10</h3>
    <div class="divider"></div>
    <div class="kv"><span>Predicted mass</span><b>${o.mass.toFixed(0)} kg (${o.massRed>=0?'−':'+'}${Math.abs(o.massRed).toFixed(1)}%)</b></div>
    <div class="kv"><span>Safety margin</span><b>${((o.safety-1)*100).toFixed(1)}%</b></div>
    <div class="kv"><span>Unresolved risks</span><b>${o.unres}</b></div>
    <div class="kv"><span>Embodied carbon</span><b>${o.co2.toFixed(0)} kgCO₂e</b></div>
    <p style="font-size:12.5px;line-height:1.7;margin-top:12px;color:var(--pearl-dim)">${verdict}</p></div>`);
  logEntry(`Loadout test: score ${o.score.toFixed(1)}/10, mass ${o.mass.toFixed(0)} kg.`); },
saveConfig(){ this.recalc();
  S.savedLoadouts.unshift({t:Date.now(),slots:{...S.loadoutSlots},score:this.outcome.score,mass:this.outcome.mass});
  S.savedLoadouts=S.savedLoadouts.slice(0,5); save(); this.renderSaved(); toast('Configuration saved to hangar'); },
renderSaved(){ const el=$('#lo-savedlist');
  el.innerHTML=S.savedLoadouts.length? S.savedLoadouts.map((c,i)=>`<div class="kv" style="cursor:pointer" data-lc="${i}" title="Click to restore">
    <span>${new Date(c.t).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} — ${Object.values(c.slots).filter(Boolean).length} slots</span>
    <b>${c.score.toFixed(1)}/10 · ${c.mass.toFixed(0)} kg</b></div>`).join('') : '<p class="tiny dim">Nothing saved yet.</p>';
  $$('#lo-savedlist [data-lc]').forEach(d=>d.addEventListener('click',()=>{ S.loadoutSlots={...S.savedLoadouts[+d.dataset.lc].slots};
    save(); this.syncSlots(); this.recalc(); toast('Configuration restored'); })); },
submit(){ this.recalc(); const o=this.outcome;
  if(o.nUsed<4){ toast('Assign at least four components before submitting','verm','alert'); return; }
  const passed= o.massRed>=25 && o.safety>=1 && o.unres===0;
  const partial= o.massRed>=15 && o.safety>=.95;
  if(passed){ if(!S.questsDone.aeroshell){ S.questsDone.aeroshell=true; addXP(400,'· quest complete'); addCredits(500,'· quest bounty');
      grant('zero_fail'); if(o.sustain>60) grant('sustain'); }
    Sound.discover();
    openModal(`<div class="panel-title">Quest complete</div><div class="panel-body">
      <h3 class="display" style="font-size:30px">The shell flies lighter.</h3>
      <p style="margin:12px 0;font-size:13px;line-height:1.7;color:var(--pearl-dim)">Mass down ${o.massRed.toFixed(1)}%, margin +${((o.safety-1)*100).toFixed(1)}%, no unresolved interfaces. Mission score ${o.score.toFixed(1)}/10.</p>
      <div class="notice">+400 XP · +500 credits ${o.sustain>60?'· Sustainable Systems sigil':''}</div></div>`);
    logEntry(`Quest complete — lighter aerospace shell (−${o.massRed.toFixed(1)}% mass, score ${o.score.toFixed(1)}).`,'opal'); }
  else openModal(`<div class="panel-title">Quest review</div><div class="panel-body">
    <h3 class="display" style="font-size:26px">${partial?'Close — but not certifiable.':'The review board declines.'}</h3>
    <div class="divider"></div>
    <div class="kv"><span>Mass reduction ≥ 25%</span><b style="color:${o.massRed>=25?'var(--green)':'var(--verm)'}">${o.massRed.toFixed(1)}%</b></div>
    <div class="kv"><span>Safety margin ≥ 0</span><b style="color:${o.safety>=1?'var(--green)':'var(--verm)'}">${((o.safety-1)*100).toFixed(1)}%</b></div>
    <div class="kv"><span>Unresolved risks = 0</span><b style="color:${o.unres===0?'var(--green)':'var(--verm)'}">${o.unres}</b></div>
    <p class="tiny dim" style="margin-top:12px;line-height:1.7">${o.massRed<25?'Heavier metals in the skin or frame are costing you the mass target — carbon fibre or Al-Li pull the average down. ':''}${o.unres?'Resolve the flagged interface before resubmitting. ':''}${o.safety<1?'At least one component carries too little specific strength for its station.':''}</p></div>`);
} };
SCREEN_HOOKS.loadout={enter(){ Loadout.renderShelf(); Loadout.renderTray(); Loadout.renderCompare(); Loadout.recalc(); Loadout.renderSaved(); }};
