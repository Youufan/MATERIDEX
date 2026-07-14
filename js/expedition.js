'use strict';
/* ════════════════════════════════════════════════════════════
   EXPEDITION 01 — THE PEROVSKITE STABILITY PROBLEM
   A guided scientific case study. Observe → predict → test →
   interpret → decide. No spaceships.

   Material system: CH₃NH₃PbI₃ (methylammonium lead triiodide,
   "MAPbI₃") — deliberately specific, not generic "perovskite".
   All lattice drawings are labelled schematics. Property values
   are marked measured / representative / qualitative.
   ════════════════════════════════════════════════════════════ */
const EXP_SCI={
  system:'CH₃NH₃PbI₃ — methylammonium lead triiodide (MAPbI₃)',
  context:'Singapore: year-round ~27–33 °C air temperature, module surfaces reaching 60–85 °C, relative humidity typically 75–90%, intense equatorial sunlight.',
  sources:[
    ['Kojima et al., J. Am. Chem. Soc. 131, 6050 (2009)','first perovskite solar cell (3.8%)'],
    ['NREL Best Research-Cell Efficiency Chart (interactive, continuously updated)','certified record efficiencies, single-junction perovskite >26%'],
    ['Leguy et al., Chem. Mater. 27, 3397 (2015)','reversible monohydrate → irreversible decomposition to PbI₂ under moisture'],
    ['Frost et al., Nano Lett. 14, 2584 (2014)','proposed water-driven decomposition pathway of MAPbI₃'],
    ['Conings et al., Adv. Energy Mater. 5, 1500477 (2015)','intrinsic thermal instability of MAPbI₃ at 85 °C'],
    ['Aristidou et al., Nat. Commun. 8, 15218 (2017)','light + oxygen: superoxide attacks the methylammonium cation'],
    ['Saliba et al., Energy Environ. Sci. 9, 1989 (2016)','triple-cation Cs/FA/MA compositions — improved thermal & phase stability'],
    ['Grancini et al., Nat. Commun. 8, 15684 (2017)','2D/3D interface engineering, one-year stable modules'],
    ['Whitfield et al., Sci. Rep. 6, 35685 (2016)','MAPbI₃ tetragonal→cubic transition near ~57 °C'],
    ['Meteorological Service Singapore, climate normals','temperature and humidity context'],
  ],
  glossary:{
    'bandgap':'The minimum photon energy a semiconductor can absorb. ~1.6 eV lets MAPbI₃ drink most of the visible spectrum.',
    'absorption coefficient':'How aggressively a material captures light. MAPbI₃ is ~100× stronger than silicon near the band edge, so a film 300× thinner than a human hair suffices.',
    'PbI₂':'Lead(II) iodide — the bright-yellow solid left behind when MAPbI₃ decomposes. Yellow film = dead film.',
    'hydrate':'A crystal with water molecules incorporated. The monohydrate step is still reversible; keep adding water and the collapse to PbI₂ is not.',
    'ion migration':'Iodide ions hopping between lattice sites under bias or light — MAPbI₃ is a mixed electron/ion conductor, which slowly reshapes the device from the inside.',
    'octahedron':'The PbI₆ unit — one lead surrounded by six iodines — whose corner-sharing network carries the electrons.',
  }};

const Expedition={
  step:0, stress:{moist:0,heat:0,light:0}, stressing:null, stressT:0,
  answered:false, firstTry:true, strategy:null, viewedStrategies:new Set(), openStrategies:new Set(), viewedProps:new Set(),
  cells:[], water:[], escaping:[], ions:[], done:false,

/* ─────────── lifecycle ─────────── */
init(){ this.wrap=$('#exp-stage'); this.cv=$('#exp-canvas'); if(!this.cv) return;
  this.ctx=this.cv.getContext('2d');
  this.restoreState();
  this.buildLattice();
  $('#exp-back').addEventListener('click',()=>this.goStep(Math.max(0,this.step-1)));
  $('#exp-restart').addEventListener('click',()=>this.restart(true));
  $('#exp-track').addEventListener('click',()=>{ if(!window.Quests) return;
    if(S.trackedArc==='first') Quests.untrackArc(); else Quests.trackArc('first');
    this.syncTrackButton(); });
  $('#exp-exit').addEventListener('click',()=>nav('core'));
  this.syncTrackButton();
  this.goStep(this.step,true);
  this.loop(); },
restoreState(){ const sv=S.expedition;
  if(sv&&sv.v===2){ this.step=sv.step||0; this.stress=sv.stress||{moist:0,heat:0,light:0};
    this.answered=!!sv.answered; this.strategy=sv.strategy||null; this.done=!!sv.done;
    if(this.done) this.step=5; }
  else S.expedition={v:2,step:0,stress:this.stress,answered:false,strategy:null,done:false}; },
persist(){ S.expedition={v:2,step:this.step,stress:this.stress,answered:this.answered,
    strategy:this.strategy,done:this.done}; save(); },
syncTrackButton(){ const b=$('#exp-track'); if(!b) return;
  const on=S.trackedArc==='first'; b.textContent=on?'Untrack expedition':'Track expedition'; b.classList.toggle('primary',on); },
restart(confirm){ if(confirm&&!this.done&&(this.stress.moist||this.answered)){
    openModal(`<div class="panel-title">Restart investigation</div><div class="panel-body">
      <p style="font-size:13px;line-height:1.7">Reset the specimen and start the investigation from the beginning?</p>
      <div class="ctl-group" style="margin-top:14px">
        <button class="ctl danger" id="exr-yes">Restart</button><button class="ctl" id="exr-no">Keep going</button></div></div>`);
    $('#exr-yes').addEventListener('click',()=>{ closeModal(); this.restart(false); });
    $('#exr-no').addEventListener('click',closeModal); return; }
  this.step=0; this.stress={moist:0,heat:0,light:0}; this.stressing=null; this.answered=false;
  this.firstTry=true; this.strategy=null; this.done=false; this.viewedStrategies.clear(); this.openStrategies.clear(); this.viewedProps.clear();
  this.buildLattice(); this.persist(); this.goStep(0,true);
  logEntry('Perovskite investigation restarted — fresh specimen loaded.'); },

/* ─────────── schematic lattice model ───────────
   Cells carry a state that follows the real mechanism:
   pristine → (moisture) hydrate → PbI₂, surface-inward
   pristine → (heat) MA escapes → vacant cage → PbI₂, bulk-wide
   pristine → (light) iodide hops → traps accumulate at boundary */
buildLattice(){ this.cells=[]; this.water=[]; this.escaping=[]; this.ions=[];
  const COLS=13, ROWS=6; this.COLS=COLS; this.ROWS=ROWS;
  let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed%10000)/10000; };
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    this.cells.push({c,r,state:'pristine',hyd:0,ph:rnd(),wob:0,traps:0});
  // re-apply persisted stress states deterministically
  if(this.stress.moist) this.applyMoist(this.stress.moist,true);
  if(this.stress.heat) this.applyHeat(this.stress.heat,true);
  if(this.stress.light) this.applyLight(this.stress.light,true); },
cellAt(c,r){ return this.cells[r*this.COLS+c]; },
applyMoist(p,inst){ // hydration front from the top surface, then irreversible PbI₂
  this.cells.forEach(cell=>{ const depth=cell.r/this.ROWS;
    const front=p*1.25-depth;
    if(front>.45&&cell.ph<.9) cell.state='pbi2';
    else if(front>.08) { if(cell.state==='pristine') cell.state='hydrate'; cell.hyd=clamp(front*2,0,1); } }); },
applyHeat(p,inst){ // MA volatilisation — bulk-wide, weakest cages first
  this.cells.forEach(cell=>{ cell.wob=p;
    if(cell.ph<p*.75){ cell.state= cell.ph<p*.5? 'pbi2':'vacant'; } }); },
applyLight(p,inst){ // iodide migration → traps accumulate near the mid grain boundary
  this.cells.forEach(cell=>{ const nearGB=Math.abs(cell.c-this.COLS/2)<1.6;
    if(nearGB&&cell.ph<p) cell.traps=clamp(p*1.4,0,1); }); },

/* ─────────── derived properties (qualitative indicators) ─────────── */
props(){ const nP=this.cells.filter(c=>c.state==='pristine').length/this.cells.length;
  const nPb=this.cells.filter(c=>c.state==='pbi2').length/this.cells.length;
  const nHyd=this.cells.filter(c=>c.state==='hydrate').length/this.cells.length;
  const traps=this.cells.reduce((a,c)=>a+c.traps,0)/this.cells.length;
  const absorb=clamp(1-nPb*.9-nHyd*.35,0,1);       // PbI₂ barely absorbs visible vs MAPbI₃
  const integrity=clamp(1-nPb-nHyd*.5-traps*.4,0,1);
  const perf=clamp(absorb*integrity*(1-traps*.5),0,1);
  return {absorb,integrity,perf,nPb,nHyd,traps}; },

/* ─────────── step engine ─────────── */
goStep(n,silent){ this.step=clamp(n,0,5); if(!silent){ Sound.glass(); this.persist(); }
  $$('#exp-stepper i').forEach((el,i)=>{ el.classList.toggle('on',i===this.step);
    el.classList.toggle('done',i<this.step); });
  $('#exp-stepnum').textContent=(this.step+1)+' of 6';
  $('#exp-back').style.visibility=this.step>0?'visible':'hidden';
  this.renderTask(); },
primary(label,fn,disabled){ return `<button class="ctl primary" id="exp-primary" ${disabled?'disabled':''}>${label}</button>`; },
wirePrimary(fn){ const b=$('#exp-primary'); if(b) b.addEventListener('click',fn); },
bar(label,v,note){ return `<div class="pbar" style="grid-template-columns:150px 1fr 60px">
  <span>${label}</span><div class="tr"><i style="width:${v*100}%"></i></div><b>${note||Math.round(v*100)+'%'}</b></div>`; },
gloss(term){ const g=EXP_SCI.glossary[term];
  return `<button class="exp-gloss" data-gloss="${term}">${term}</button>`; },
wireGloss(){ $$('#exp-task [data-gloss]').forEach(b=>b.addEventListener('click',()=>{
    toast(`<b>${b.dataset.gloss}</b> — ${EXP_SCI.glossary[b.dataset.gloss]}`,'','hex',9000); })); },

renderTask(){ const T=$('#exp-task'); const p=this.props();
  const S0=[
/* ── 1 · MEET THE MATERIAL ── */
()=>{ T.innerHTML=`
  <div class="eyebrow">Investigation 01 · step 1 — meet the material</div>
  <h2 class="exp-h">The Perovskite Stability Problem</h2>
  <p class="exp-p"><b>Objective:</b> develop a perovskite solar absorber that survives Singapore's hot, humid climate.</p>
  <p class="exp-p">This is <b>${EXP_SCI.system}</b> — the crystal that started the perovskite solar boom.
  Its ${this.gloss('octahedron')} network absorbs sunlight ferociously: a film thinner than a soap bubble
  captures what silicon needs a slab for, and it is printed from solution at low temperature.
  Certified lab cells now exceed 26% efficiency.</p>
  <p class="exp-p">One problem. In the field it can fall apart in weeks. Your job is to find out why — and fix it.</p>
  <p class="tiny dim">The lattice on the left is a labelled 2D schematic of the ABX₃ structure — A-site cations (CH₃NH₃⁺) sitting in cages of corner-sharing PbI₆ octahedra. Not to scale.</p>
  <div class="row" style="margin-top:14px">${this.primary('Establish the baseline →')}</div>`;
  this.wirePrimary(()=>this.goStep(1)); this.wireGloss(); },
/* ── 2 · BASELINE ── */
()=>{ const seen=this.viewedProps;
  T.innerHTML=`
  <div class="eyebrow">Step 2 — establish the baseline</div>
  <h2 class="exp-h">Know it before you break it.</h2>
  <p class="exp-p">Tap each property to understand what it means. These are your reference points — everything you do next will be measured against them.</p>
  <div class="exp-props">
    ${[['absorb','Light absorption','~10⁵ cm⁻¹ near band edge','measured range','Captures most visible light within ~0.5 µm of film — the core superpower.'],
       ['gap','Bandgap','~1.6 eV','measured','Close to the sweet spot for single-junction solar harvesting; set by the Pb–I network.'],
       ['eff','Device efficiency','>26% certified (lab record)','representative — NREL chart','What research cells achieve fresh. Field survival is another matter.'],
       ['stab','Structural stability','LOW — qualitative','qualitative indicator','The ionic lattice is soft: bound by weak interactions, host to a volatile organic cation. Remember this one.']]
    .map(([k,n,v,kind,d])=>`<button class="exp-prop ${seen.has(k)?'seen':''}" data-prop="${k}">
      <b>${n}</b><span class="mono">${v}</span><small>${kind}</small>
      <p class="exp-prop-d">${d}</p></button>`).join('')}
  </div>
  <div class="row" style="margin-top:12px;justify-content:space-between">
    <span class="tiny dim">${seen.size<2?'Inspect at least two properties':'Baseline understood'}</span>
    ${this.primary('Begin stress testing →',null,seen.size<2)}</div>`;
  $$('#exp-task [data-prop]').forEach(b=>b.addEventListener('click',()=>{
    b.classList.toggle('open'); if(!this.viewedProps.has(b.dataset.prop)){ this.viewedProps.add(b.dataset.prop);
      b.classList.add('seen'); Sound.hover();
      if(this.viewedProps.size>=2) this.renderTask(); } }));
  this.wirePrimary(()=>this.goStep(2)); },
/* ── 3 · STRESS ── */
()=>{ const st=this.stress; const busy=!!this.stressing;
  T.innerHTML=`
  <div class="eyebrow">Step 3 — stress the material</div>
  <h2 class="exp-h">Singapore, condensed into a chamber.</h2>
  <p class="exp-p">${EXP_SCI.context} Expose the film to one factor at a time and watch the lattice respond. Accelerated ageing — hours compress into seconds.</p>
  <div class="exp-stressors">
    ${[['moist','Humidity 85% RH','water infiltrates from the surface',st.moist],
       ['heat','Heat 85 °C','the industry damp-heat benchmark',st.heat],
       ['light','Continuous illumination','one-sun soak, ions on the move',st.light]]
    .map(([k,n,d,v])=>`<div class="exp-stressor ${v>=1?'donex':''}">
      <div class="row" style="justify-content:space-between"><b>${n}</b>
        <button class="ctl sm ${k==='moist'&&!v?'primary':''}" data-stress="${k}" ${busy||v>=1?'disabled':''}>${v>=1?'Complete ✓':busy&&this.stressing===k?'Running…':'Expose'}</button></div>
      <small>${d}</small>
      <div class="tr" style="height:2px;background:rgba(246,242,234,.08);border-radius:1px;margin-top:7px;overflow:hidden"><i style="display:block;height:100%;width:${v*100}%;background:linear-gradient(90deg,var(--opal),var(--verm))"></i></div>
    </div>`).join('')}
  </div>
  <div class="exp-live">
    ${this.bar('Light absorption',p.absorb)}
    ${this.bar('Lattice integrity',p.integrity)}
    ${this.bar('Est. device output',p.perf)}
    <p class="tiny dim" style="margin-top:4px">Qualitative indicators derived from the schematic lattice — educational, not measured device data.</p>
  </div>
  <div class="row" style="margin-top:10px;justify-content:space-between">
    <span class="tiny dim">${st.moist>=1?'Evidence collected — the film has visibly changed.':'Run at least the humidity exposure.'}</span>
    ${this.primary('Investigate the failure →',null,st.moist<1||busy)}</div>`;
  $$('#exp-task [data-stress]').forEach(b=>b.addEventListener('click',()=>this.runStress(b.dataset.stress)));
  this.wirePrimary(()=>this.goStep(3)); },
/* ── 4 · INVESTIGATE ── */
()=>{ if(this.answered){ this.renderExplain(); return; }
  T.innerHTML=`
  <div class="eyebrow">Step 4 — investigate the failure</div>
  <h2 class="exp-h">The film turned yellow. Why?</h2>
  <p class="exp-p">Look at the evidence: the change began at the exposed surface and marched inward.
  A pale intermediate appeared first, then a bright-yellow phase that stayed yellow after drying. What happened?</p>
  <div class="col" style="gap:8px;margin-top:6px">
    <button class="evt-choice" data-ans="pbi2"><span>Water infiltrated the lattice and broke it down — the volatile organic cation left, leaving yellow ${this.gloss('PbI₂')}</span><small>irreversible decomposition</small></button>
    <button class="evt-choice" data-ans="swell"><span>The lattice absorbed water and expanded — it will fully recover once dried</span><small>reversible swelling</small></button>
    <button class="evt-choice" data-ans="oxide"><span>The lead oxidised into a rust-like lead oxide surface layer</span><small>surface oxidation</small></button>
  </div>
  <p class="tiny dim" style="margin-top:10px">First answer counts — study the animation before you commit.</p>`;
  this.wireGloss();
  $$('#exp-task [data-ans]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.ans==='pbi2'){ this.answered=true; this.persist();
      if(this.firstTry){ addXP(90,'· degradation mechanism identified first try'); }
      else addXP(30,'· mechanism identified');
      Sound.discover(); this.renderExplain(); }
    else{ this.firstTry=false; Sound.fail();
      toast(b.dataset.ans==='swell'
        ?'Check the evidence: the pale hydrate stage IS reversible — but the yellow phase persisted after drying. Something permanent happened.'
        :'Rust-red is iron\'s signature, and oxides need oxygen incorporation — the yellow phase here appeared under humid nitrogen too. Look at the water.', 'verm','alert',8000); } })); },
/* ── 5 · SOLUTIONS ── */
()=>{ const SOLS=this.solutions();
  T.innerHTML=`
  <div class="eyebrow">Step 5 — choose a solution</div>
  <h2 class="exp-h">Four real strategies. No free lunch.</h2>
  <p class="exp-p">Compare at least two before committing. Every row is a trade — that is the whole discipline.</p>
  <div class="exp-sols">${SOLS.map((s2,i)=>`
    <button class="exp-sol ${this.viewedStrategies.has(i)?'seen':''} ${this.openStrategies.has(i)||this.strategy===i?'open':''} ${this.strategy===i?'picked':''}" data-sol="${i}">
      <b>${s2.n}</b><small>${s2.tag}</small>
      <div class="exp-sol-d">
        <p>${s2.d}</p>
        <div class="exp-dots">
          ${[['Stability',s2.stab],['Efficiency kept',s2.eff],['Toxicity',s2.tox],['Cost',s2.cost],['Complexity',s2.cx]]
            .map(([k,v])=>`<span>${k} ${'●'.repeat(v)+'○'.repeat(5-v)}</span>`).join('')}
        </div><p class="tiny dim">${s2.src}</p></div></button>`).join('')}
  </div>
  <div class="row" style="margin-top:12px;justify-content:space-between">
    <span class="tiny dim">${this.viewedStrategies.size<2?'Open at least two strategies to compare':this.strategy==null?'Select the strategy to adopt':'Strategy selected'}</span>
    ${this.primary('Adopt strategy & conclude →',null,this.strategy==null||this.viewedStrategies.size<2)}</div>`;
  $$('#exp-task [data-sol]').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.sol;
    if(!this.viewedStrategies.has(i)){ this.viewedStrategies.add(i); this.openStrategies.add(i);
      Sound.hover(); this.renderTask(); return; }
    this.strategy=i; this.persist(); Sound.click(); this.renderTask(); }));
  this.wirePrimary(()=>this.conclude()); },
/* ── 6 · CONCLUSION ── */
()=>{ this.renderConclusion(); }];
  S0[this.step](); },

runStress(k){ if(this.stressing||this.stress[k]>=1) return;
  this.stressing=k; this.stressT=0; Sound.click();
  logEntry(`Perovskite investigation — ${k==='moist'?'85% RH humidity':k==='heat'?'85 °C thermal':'continuous illumination'} exposure started.`);
  this.renderTask(); },

renderExplain(){ const T=$('#exp-task');
  T.innerHTML=`
  <div class="eyebrow">Step 4 — mechanism confirmed</div>
  <h2 class="exp-h">Hydrate first. PbI₂ forever.</h2>
  <p class="exp-p"><b>What actually happens:</b> water molecules slip into the soft ionic lattice and form a
  ${this.gloss('hydrate')} — CH₃NH₃PbI₃·H₂O — which is still reversible. Keep the humidity coming and the structure
  collapses: the methylammonium cation leaves (as methylamine + HI), and bright-yellow ${this.gloss('PbI₂')} remains.
  That step does not reverse on drying <i>(Leguy 2015; Frost 2014)</i>.</p>
  <p class="exp-p">Heat attacks the same weakness from another angle — at 85 °C the volatile organic cation escapes
  even in inert atmosphere <i>(Conings 2015)</i>. Light adds ${this.gloss('ion migration')} and, with oxygen,
  superoxide that deprotonates the cation <i>(Aristidou 2017)</i>. Three stressors, one shared root:
  <b>the organic A-site cation is the weak link.</b></p>
  <div class="row" style="margin-top:14px">${this.primary('Choose a solution →')}</div>`;
  this.wirePrimary(()=>this.goStep(4)); this.wireGloss(); },

solutions(){ return [
  {n:'Glass–glass encapsulation',tag:'seal the water out',stab:4,eff:5,tox:2,cost:3,cx:2,
   d:'Borrowed from the silicon industry: laminate the cell between glass with an edge seal. Blocks moisture almost completely — but does nothing about intrinsic heat sensitivity, and the lead is still inside.',
   src:'Standard PV practice; moisture pathway per Leguy 2015.'},
  {n:'Triple-cation composition (Cs/FA/MA)',tag:'engineer a tougher crystal',stab:4,eff:4,tox:2,cost:3,cx:4,
   d:'Replace most of the volatile methylammonium with formamidinium and cesium. The lattice keeps its black phase, tolerates heat far better, and reproducibility improves — at the cost of a more complex precursor chemistry.',
   src:'Saliba et al., Energy Environ. Sci. 2016.'},
  {n:'2D/3D capping layer',tag:'grow a raincoat on the surface',stab:3,eff:4,tox:2,cost:2,cx:3,
   d:'A thin layer of bulky-cation 2D perovskite on top of the 3D absorber acts as a built-in moisture barrier. One-year stable modules demonstrated — with a small efficiency toll at the interface.',
   src:'Grancini et al., Nat. Commun. 2017.'},
  {n:'Lead-free tin perovskite',tag:'remove the toxicity instead',stab:1,eff:2,tox:5,cost:3,cx:4,
   d:'Swap Pb for Sn and the toxicity concern shrinks — but Sn²⁺ oxidises to Sn⁴⁺ on contact with air, so today these cells degrade faster and convert less. An honest research frontier, not a field solution yet.',
   src:'Widely reported Sn²⁺ instability; representative assessment.'}]; },

conclude(){ this.done=true; this.persist(); this.goStep(5);
  S.expeditionsDone=(S.expeditionsDone||0)+1;
  const first=!S.discovered.perovskite;
  discover('perovskite','Perovskite Stability Investigation');
  grant('bandgap');
  addXP(150,'· investigation complete');
  logEntry(`Perovskite Stability Problem concluded — strategy: ${this.solutions()[this.strategy].n}. MAPbI₃ field note archived.`,'opal');
  if(window.Quests) setTimeout(()=>Quests.event('expedition',{success:true}),500); },
renderConclusion(){ const T=$('#exp-task'); const s2=this.solutions()[this.strategy||0];
  const outcome=[
    'Your sealed panel shrugs off the monsoon season — accelerated damp-heat testing shows minimal yellowing. Under prolonged 85 °C soak, some intrinsic MA loss still appears: encapsulation guards the border, not the citizen.',
    'The Cs/FA-rich film holds its black phase through the damp-heat protocol and its efficiency curve stays flat where MAPbI₃ sagged. The remaining moisture sensitivity now justifies pairing with encapsulation — belt and braces, like the record-holding labs do.',
    'The 2D skin sheds humidity impressively; degradation now creeps in mainly at pinholes and edges. Interface resistance trims a little output — the price of the raincoat.',
    'The tin cell ducks the toxicity question and answers with a new one: within days, oxidised Sn⁴⁺ regions bleach the film. Right values, wrong decade — keep it on the research bench.'][this.strategy||0];
  T.innerHTML=`
  <div class="eyebrow">Step 6 — investigation concluded</div>
  <h2 class="exp-h">${s2.n}.</h2>
  <p class="exp-p">${outcome}</p>
  <div class="notice" style="margin:10px 0">
    <b>Principle learned:</b> MAPbI₃'s brilliance and fragility share one origin — a soft ionic lattice holding a
    volatile organic cation. Durable perovskite photovoltaics protect that weakness twice: a tougher composition
    inside, a moisture barrier outside.</div>
  <div class="row wrap" style="gap:8px;margin:6px 0">
    <span class="chip on">MAPbI₃ field note archived</span>
    <span class="chip on">+150 XP</span><span class="chip on">Violet Bandgap sigil</span></div>
  <details class="exp-src"><summary>Sources & evidence (${EXP_SCI.sources.length})</summary>
    ${EXP_SCI.sources.map(([s3,w2])=>`<p class="tiny dim">· ${s3} — <i>${w2}</i></p>`).join('')}
    <p class="tiny dim" style="margin-top:6px">Lattice animation is a labelled 2D schematic of mechanism, not a molecular-dynamics simulation. Property bars are qualitative educational indicators.</p></details>
  <div class="ctl-group" style="margin-top:14px">
    <button class="ctl primary" id="exp-openentry">Open MAPbI₃ entry</button>
    <button class="ctl" id="exp-tocore">Return to Research Core</button>
    <button class="ctl" id="exp-again">Restart investigation</button></div>`;
  $('#exp-openentry').addEventListener('click',()=>{ Codex.show('perovskite'); nav('codex'); });
  $('#exp-tocore').addEventListener('click',()=>nav('core'));
  $('#exp-again').addEventListener('click',()=>this.restart(false)); },

/* ─────────── the stage — schematic lattice + film chip ─────────── */
loop(){ requestAnimationFrame(()=>this.loop());
  if(CURRENT!=='expedition'||!this.wrap) return;
  const w=this.wrap.clientWidth,h=this.wrap.clientHeight; if(!w) return;
  if(this.cv.width!==w*PR){ this.cv.width=w*PR; this.cv.height=h*PR; }
  const ctx=this.ctx; ctx.setTransform(PR,0,0,PR,0,0); ctx.clearRect(0,0,w,h);
  const t=now()/1000; const rm=document.documentElement.dataset.motion==='reduced';
  /* stress progression */
  if(this.stressing){ this.stressT+=1/480;      // ~8 s per exposure
    const k=this.stressing; this.stress[k]=Math.min(1,this.stressT);
    if(k==='moist') this.applyMoist(this.stress[k]);
    if(k==='heat') this.applyHeat(this.stress[k]);
    if(k==='light') this.applyLight(this.stress[k]);
    if((this._rt=(this._rt||0)+1)%30===0) this.renderTask();
    if(this.stress[k]>=1){ this.stressing=null; Sound.alert(); this.persist(); this.renderTask();
      logEntry(`Exposure complete — ${k==='moist'?'film visibly yellowed from the surface inward':k==='heat'?'organic cation loss throughout the bulk':'trap states accumulated at the grain boundary'}.`); } }
  const p=this.props();
  /* layout */
  const pad=Math.max(26,w*.05);
  const LW=w-pad*2, LH=Math.min(h*.52,LW*.44), LX=pad, LY=h*.16;
  const cw=LW/this.COLS, ch=LH/this.ROWS;
  /* chamber ambience per stress */
  if(this.stressing==='heat'||this.stress.heat>0&&this.stressing==='heat'){ }
  const ambCol= this.stressing==='heat'? 'rgba(255,120,60,.08)' : this.stressing==='moist'? 'rgba(100,160,220,.07)' : this.stressing==='light'? 'rgba(255,230,160,.07)' : 'rgba(90,80,160,.05)';
  const amb=ctx.createRadialGradient(w/2,LY+LH/2,10,w/2,LY+LH/2,LW*.7);
  amb.addColorStop(0,ambCol); amb.addColorStop(1,'transparent');
  ctx.fillStyle=amb; ctx.fillRect(0,0,w,h);
  /* header */
  ctx.fillStyle='rgba(246,242,234,.85)'; ctx.font='10.5px "Archivo Narrow"'; ctx.textAlign='center';
  ctx.fillText('CH₃NH₃PbI₃ — SCHEMATIC ABX₃ LATTICE (2D SECTION, NOT TO SCALE)',w/2,LY-26);
  ctx.fillStyle='rgba(163,156,141,.7)'; ctx.font='8.5px "IBM Plex Mono"';
  ctx.fillText('exposed surface ↓',w/2,LY-12);
  /* environment particles above surface */
  if(this.stressing==='moist'||this.stress.moist>0&&this.stressing==='moist'){}
  if(this.stressing==='moist'&&!rm){ for(let i=0;i<16;i++){ const u=((t*.25+i*.13)%1);
      const x=LX+((i*67)%100)/100*LW, y=LY-40+u*44;
      ctx.fillStyle='rgba(120,190,240,.75)';
      ctx.beginPath(); ctx.arc(x,y,2.1,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(x-2.6,y-2,1.2,0,7); ctx.arc(x+2.6,y-2,1.2,0,7); ctx.fill(); } }
  if(this.stressing==='light'&&!rm){ for(let i=0;i<9;i++){ const u=((t*.6+i*.17)%1);
      const x=LX+20+i*LW/9;
      ctx.strokeStyle='rgba(255,225,140,.7)'; ctx.beginPath();
      ctx.moveTo(x,LY-42+u*30); ctx.lineTo(x-4,LY-34+u*30); ctx.stroke(); } }
  if(this.stressing==='heat'&&!rm){ for(let i=0;i<7;i++){ const u=((t*.4+i*.19)%1);
      ctx.strokeStyle=`rgba(255,140,80,${.5-u*.4})`;
      const x=LX+30+i*LW/7;
      ctx.beginPath(); ctx.moveTo(x,LY+LH+22-u*26); ctx.quadraticCurveTo(x+5,LY+LH+14-u*26,x,LY+LH+6-u*26); ctx.stroke(); } }
  /* lattice cells */
  this.cells.forEach(cell=>{ const x=LX+cell.c*cw+cw/2, y=LY+cell.r*ch+ch/2;
    const wob= rm?0 : (cell.wob||this.stress.heat*0)*Math.sin(t*7+cell.ph*9)*2.2
      + (cell.state==='pristine'? Math.sin(t*1.6+cell.ph*6)*.5 : 0);
    const R=Math.min(cw,ch)*.36;
    if(cell.state==='pbi2'){ /* PbI₂ — collapsed layered yellow plates */
      ctx.strokeStyle='rgba(232,196,80,.9)'; ctx.fillStyle='rgba(232,196,80,.22)';
      for(let l=0;l<3;l++){ ctx.beginPath();
        ctx.rect(x-R,y-R*.5+l*R*.5,R*2,R*.28); ctx.fill(); ctx.stroke(); } }
    else{ /* PbI₆ octahedron glyph (diamond) */
      const hyd=cell.state==='hydrate'? cell.hyd:0;
      const grow=1+hyd*.16;   // hydrate slightly expands the cage
      ctx.strokeStyle= cell.state==='hydrate'? 'rgba(150,200,240,.85)' : 'rgba(178,158,235,.8)';
      if(cell.state==='hydrate') ctx.setLineDash([3,2.5]);
      ctx.beginPath();
      ctx.moveTo(x+wob,y-R*grow); ctx.lineTo(x+R*grow+wob,y); ctx.lineTo(x+wob,y+R*grow);
      ctx.lineTo(x-R*grow+wob,y); ctx.closePath();
      ctx.fillStyle= cell.state==='hydrate'? 'rgba(150,200,240,.1)':'rgba(139,108,240,.12)';
      ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      /* iodide corner dots */
      ctx.fillStyle='rgba(216,200,164,.85)';
      [[0,-R*grow],[R*grow,0],[0,R*grow],[-R*grow,0]].forEach(([dx,dy])=>{
        ctx.beginPath(); ctx.arc(x+dx+wob,y+dy,1.6,0,7); ctx.fill(); });
      /* A-site cation in the cage */
      if(cell.state!=='vacant'){ ctx.fillStyle= cell.state==='hydrate'? 'rgba(190,220,250,.9)':'rgba(240,168,248,.9)';
        ctx.beginPath(); ctx.arc(x+wob*1.4,y,2.6+(cell.wob?Math.sin(t*9+cell.ph*7)*.8:0),0,7); ctx.fill(); }
      else{ ctx.strokeStyle='rgba(240,168,248,.3)'; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.arc(x,y,2.6,0,7); ctx.stroke(); ctx.setLineDash([]); }
      /* iodide trap accumulation (light stress) */
      if(cell.traps>0){ ctx.fillStyle=`rgba(255,90,54,${cell.traps*.9})`;
        ctx.beginPath(); ctx.arc(x+R*.7,y-R*.5+(rm?0:Math.sin(t*3+cell.ph*8)*1.5),2,0,7); ctx.fill(); } } });
  /* escaping MA cations during heat */
  if(this.stressing==='heat'&&!rm){ for(let i=0;i<6;i++){ const u=((t*.5+i*.21)%1);
      const x=LX+((i*53)%100)/100*LW;
      ctx.fillStyle=`rgba(240,168,248,${.9-u*.85})`;
      ctx.beginPath(); ctx.arc(x,LY-6-u*34,2.4,0,7); ctx.fill(); } }
  /* grain boundary marker for light stress */
  if(this.stress.light>0){ ctx.strokeStyle='rgba(246,242,234,.2)'; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(LX+LW/2,LY-4); ctx.lineTo(LX+LW/2,LY+LH+4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(163,156,141,.7)'; ctx.font='7.5px "IBM Plex Mono"'; ctx.textAlign='center';
    ctx.fillText('grain boundary',LX+LW/2,LY+LH+16); }
  /* film chip — macroscopic evidence */
  const FY=LY+LH+34, FH=Math.min(34,h*.06);
  ctx.fillStyle='rgba(163,156,141,.75)'; ctx.font='8.5px "IBM Plex Mono"'; ctx.textAlign='left';
  ctx.fillText('film, as your eye would see it:',LX,FY-7);
  for(let i=0;i<40;i++){ const u=i/40;
    const cellRef=this.cells[Math.floor(u*this.COLS)+this.COLS*Math.min(this.ROWS-1,Math.floor((i%4)))];
    const yellow=p.nPb, hyd=p.nHyd;
    // colour blend: pristine dark brown-black → yellow with PbI₂ fraction
    const rr=Math.round(30+yellow*200+hyd*30), gg=Math.round(22+yellow*168+hyd*40), bb=Math.round(28+yellow*40+hyd*60);
    ctx.fillStyle=`rgb(${rr},${gg},${bb})`;
    // moisture yellows from the top edge — show gradient left→right as depth proxy
    const localYellow=clamp(yellow*1.3-(1-u)*.1,0,1);
    ctx.fillStyle=`rgb(${30+localYellow*205|0},${22+localYellow*172|0},${28+localYellow*44|0})`;
    ctx.fillRect(LX+u*LW,FY,LW/40+.5,FH); }
  ctx.strokeStyle='rgba(246,242,234,.3)'; ctx.strokeRect(LX,FY,LW,FH);
  if(p.nPb>.05){ ctx.fillStyle='rgba(232,196,80,.9)'; ctx.font='8.5px "Archivo Narrow"'; ctx.textAlign='right';
    ctx.fillText('YELLOWING = PbI₂',LX+LW,FY+FH+12); }
  /* legend */
  ctx.font='8px "Archivo Narrow"'; ctx.textAlign='left';
  const leg=[['◇ PbI₆ octahedron','rgba(178,158,235,.9)'],['● CH₃NH₃⁺ cation','rgba(240,168,248,.9)'],
    ['◇ hydrated (reversible)','rgba(150,200,240,.9)'],['▬ PbI₂ (irreversible)','rgba(232,196,80,.9)'],
    ['● iodide trap','rgba(255,90,54,.9)']];
  leg.forEach(([txt,col],i)=>{ ctx.fillStyle=col; ctx.fillText(txt,LX+i*(LW/leg.length),h-12); });
} };
