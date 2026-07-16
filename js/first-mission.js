'use strict';

const FIRST_MISSION_IDS=['graphene','mxene','pedot'];
const FIRST_MISSION_STEPS=[
  {id:'graphene',place:'Material Codex',title:'Inspect Graphene',investigate:'A one-atom-thick sp² carbon honeycomb.',insight:'Graphene’s in-plane σ bonds provide exceptional strength while delocalised π electrons carry charge across the sheet.',why:'This is the performance ceiling, but defects and film transfer determine whether a wearable can approach it.'},
  {id:'mxene',place:'Material Codex',title:'Inspect Ti₃C₂Tₓ MXene',investigate:'A Ti–C–Ti–C–Ti carbide sheet with O, OH and F surface terminations.',insight:'The metallic carbide backbone conducts, while surface terminations make the sheet dispersible and printable but also influence stability.',why:'A wearable needs both electrical transport and a film that can be processed onto a flexible support.'},
  {id:'pedot',place:'Material Codex',title:'Inspect PEDOT:PSS',investigate:'Conjugated PEDOT chains distributed through a PSS-rich polymer phase.',insight:'Charge moves along doped conjugated chains and between conductive domains, giving a flexible coating whose conductivity depends strongly on formulation.',why:'Polymer architecture sacrifices peak conductivity for bending tolerance and scalable coating.'},
  {place:'Laboratory',title:'Run a tensile test on PEDOT:PSS',investigate:'How a low-modulus conducting polymer responds to imposed strain.',insight:'The tensile model is a simplified educational estimate: the soft polymer deforms much more readily than a covalent or carbide sheet.',why:'A skin-mounted device must survive repeated deformation without losing its conductive pathway.'},
  {place:'Compare',title:'Compare all three candidates',investigate:'Conductivity, flexibility, processing and environmental limitations together.',insight:'No candidate dominates every criterion; the best choice follows from the actual service requirements.',why:'Engineering selection is a traceable trade-off, not a search for the largest single property value.'},
  {place:'Decision',title:'Select the best overall candidate',investigate:'A lightweight transparent coating that tolerates bending and can be deposited from solution.',insight:'PEDOT:PSS is not the most conductive candidate, but its polymer form makes it the most practical balanced choice for this stated wearable brief.',why:'The final decision must connect visible structure to manufacturing and in-service behaviour.'},
  {place:'Collection',title:'Unlock the selected material',investigate:'Record the evidence-backed selection in your Collection.',insight:'A material is useful only when its structure, properties, processing and limitations fit the same design brief.',why:'The Collection records materials you have justified, not merely viewed.'}
];

const FIRST_MISSION_EVIDENCE={
  graphene:{name:'Graphene',structure:'Hexagonal sp² carbon sheet',transport:'Delocalised π electrons give very high in-plane conductivity.',fit:'Extremely light and flexible at sheet scale.',limit:'Defects, grain boundaries and transfer damage reduce large-area film performance.'},
  mxene:{name:'Ti₃C₂Tₓ MXene',structure:'Terminated Ti–C–Ti–C–Ti sheet',transport:'The carbide backbone is metallically conductive; Tₓ controls surface chemistry.',fit:'Water-processable flakes can form flexible printed films.',limit:'Humidity and oxidation threaten long-term performance; etching chemistry requires care.'},
  pedot:{name:'PEDOT:PSS',structure:'Conjugated polymer chains and conductive domains',transport:'Doping and chain organisation create a formulation-dependent conductive network.',fit:'Light, flexible, transparent and directly coatable from aqueous dispersions.',limit:'Conductivity is below the 2D sheets and humidity sensitivity usually requires encapsulation.'}
};
const FIRST_MISSION_COMPARE_ROWS=[
  ['Electrical conductivity','10⁶–10⁸ S/m','10⁴–10⁶ S/m','10–10⁵ S/m'],
  ['Young’s modulus','0.8–1.1 TPa','≈330 GPa, method-dependent','1–3 GPa, formulation-dependent'],
  ['Representation','Ideal single-layer lattice','Representative terminated sheet','Representative polymer-chain model'],
  ['Practical film route','Transfer or assembled ink','Aqueous flake ink','Aqueous polymer dispersion'],
  ['Key limitation','Transfer defects and scale-up','Oxidation and humidity','Humidity and formulation dependence']
];

const FirstMission={
  state(){
    const base={status:'not-started',step:0,insights:{},tested:false,compared:false,compareReady:false,decision:null,screen:'core',lastLearned:'',dismissed:false};
    S.firstMission=Object.assign(base,S.firstMission||{});S.firstMission.insights=Object.assign({},S.firstMission.insights||{});return S.firstMission;
  },
  active(){return !!(S.firstMission&&S.firstMission.status==='active');},
  commit(){save();try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}},
  init(){this.state();this.build();this.syncFocus();this.render();if(this.active())this.restore();},
  build(){
    if(!$('#first-mission-tracker')){const el=document.createElement('aside');el.id='first-mission-tracker';el.setAttribute('aria-live','polite');document.body.appendChild(el);}
    if(this._wired)return;this._wired=true;
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-fm-action]'))this.action();
      else if(e.target.closest('[data-fm-free]'))this.pause();
      else if(e.target.closest('[data-fm-resume]'))this.resume();
      else if(e.target.closest('[data-fm-dismiss]')){this.state().dismissed=true;this.commit();this.render();}
      else {const decision=e.target.closest('[data-fm-decision]');if(decision)this.decide(decision.dataset.fmDecision);
        if(e.target.closest('[data-fm-collect]'))this.collect();}
    });
  },
  begin(){
    S.firstMission={status:'active',step:0,insights:{},tested:false,compared:false,compareReady:false,decision:null,screen:'codex',lastLearned:'Mission brief accepted: visible structure must justify the final material choice.',dismissed:false};
    S.compareSel=[...FIRST_MISSION_IDS];S.trackedArc=null;this.commit();this.syncFocus();this.render();this.goCurrent();
    logEntry('First Mission begun — select a lightweight conductive wearable material.','opal');
  },
  resume(){const st=this.state();if(st.status==='complete')return;st.status='active';st.dismissed=false;this.commit();this.syncFocus();this.render();this.restore();},
  pause(){const st=this.state();st.status='paused';st.screen=CURRENT;this.commit();this.syncFocus();this.render();nav('core');toast('Guided Mission paused — the complete universe is open. Resume it from the Research Core.');},
  syncFocus(){
    const active=this.active(),step=this.state().step;document.body.classList.toggle('mission-focus',active);
    const allowed=new Set(['core','codex']);if(step>=3)allowed.add('lab');if(step>=4)allowed.add('loadout');if(step>=6)allowed.add('collection');
    $$('.rail-btn[data-nav]').forEach(button=>{const locked=active&&!allowed.has(button.dataset.nav);button.classList.toggle('mission-locked',locked);if(locked){button.setAttribute('aria-disabled','true');if(!button.dataset.missionTabindex)button.dataset.missionTabindex=button.getAttribute('tabindex')??'';button.tabIndex=-1;button.dataset.missionTitle='1';button.title='Available in Free Exploration';}else{button.removeAttribute('aria-disabled');if(button.dataset.missionTabindex!==undefined){const prior=button.dataset.missionTabindex;prior===''?button.removeAttribute('tabindex'):button.setAttribute('tabindex',prior);delete button.dataset.missionTabindex;}if(button.dataset.missionTitle){button.removeAttribute('title');delete button.dataset.missionTitle;}}});
    const run=$('#sim-run');if(run)run.classList.toggle('mission-next',active&&this.state().step===3);
    const specimen=$('#lab-material');if(specimen)specimen.disabled=active&&step===3;
    if(typeof Lab!=='undefined'&&Lab.setGuided)Lab.setGuided(active&&step===3,active&&step===3?'pedot':null,'first-mission');
  },
  restore(){
    const st=this.state();if(!this.active())return;
    if(st.step<3){Codex.show(FIRST_MISSION_IDS[st.step]);nav('codex');}
    else if(st.step===3){Lab.setMaterial('pedot',{guided:true});nav('lab');}
    else{S.compareSel=[...FIRST_MISSION_IDS];Loadout.renderTray();Loadout.renderCompare();nav('loadout');if(st.step===6)setTimeout(()=>this.showEvidence(),0);}
  },
  goCurrent(){
    const st=this.state();if(!this.active())return;
    if(st.step<3){Codex.show(FIRST_MISSION_IDS[st.step]);nav('codex');this.render();return;}
    if(st.step===3){Lab.setMaterial('pedot',{guided:true});nav('lab');this.syncFocus();this.render();return;}
    S.compareSel=[...FIRST_MISSION_IDS];this.commit();Loadout.renderTray();Loadout.renderCompare();nav('loadout');this.renderComparison();this.render();
  },
  event(type,data={}){
    if(!this.active())return;const st=this.state();
    if(type==='nav'){st.screen=data.to;this.commit();this.syncFocus();this.render();}
    if(type==='view-material')setTimeout(()=>this.render(),0);
    if(type==='sim-complete'&&st.step===3&&data.id==='pedot'){
      st.tested=true;st.lastLearned=FIRST_MISSION_STEPS[3].insight;st.step=4;S.compareSel=[...FIRST_MISSION_IDS];this.commit();this.syncFocus();this.render();
      toast('<b>Test complete</b> — PEDOT:PSS deformation evidence recorded. Compare the candidates next.','','spark',5200);
    }
    if(type==='compare'&&st.step>=4&&FIRST_MISSION_IDS.every(id=>(data.ids||[]).includes(id))){st.compareReady=true;this.commit();this.renderComparison();this.render();}
  },
  action(){
    const st=this.state();if(!this.active())return;
    if(st.step<3){const id=FIRST_MISSION_IDS[st.step];if(CURRENT==='codex'&&Codex.id===id)this.recordInsight(id);else this.goCurrent();return;}
    if(st.step===3){if(CURRENT!=='lab'||Lab.mat!=='pedot')this.goCurrent();else{this.syncFocus();toast('Use the highlighted Run control. The mission advances when the specimen reaches failure.');}return;}
    if(st.step===4){if(CURRENT==='loadout'&&st.compareReady){st.compared=true;st.lastLearned=FIRST_MISSION_STEPS[4].insight;st.step=5;this.commit();this.renderComparison();this.render();}else this.goCurrent();return;}
    if(st.step===5){if(CURRENT!=='loadout')this.goCurrent();else{this.renderComparison();const panel=$('#first-mission-decision');if(panel)panel.scrollIntoView({behavior:'smooth',block:'center'});}return;}
    if(st.step===6)this.showEvidence();
  },
  recordInsight(id){
    const st=this.state(),expected=FIRST_MISSION_IDS[st.step];if(id!==expected)return;
    st.insights[id]=Date.now();st.lastLearned=FIRST_MISSION_STEPS[st.step].insight;S.msteps[id]=S.msteps[id]||{};S.msteps[id].view=1;st.step++;this.commit();
    Sound.glass();toast(`<b>${MATERIALS[id].name} insight recorded</b> — structure connected to function.`,'','spark',4400);this.render();setTimeout(()=>this.goCurrent(),350);
  },
  render(){
    const el=$('#first-mission-tracker');if(!el)return;const st=this.state();
    if(st.status==='complete'){
      if(st.dismissed){el.style.display='none';return;}el.style.display='block';el.innerHTML=`<div class="fm-card complete"><div class="fm-head"><span>First Mission complete</span><b>9 / 9 actions</b></div><div class="fm-progress">${'<i class="done"></i>'.repeat(9)}</div><p>PEDOT:PSS is recorded in the Collection with the evidence behind your decision.</p><button class="ctl sm" data-fm-dismiss>Dismiss</button></div>`;return;
    }
    if(!this.active()){el.style.display='none';return;}el.style.display='block';const step=FIRST_MISSION_STEPS[st.step],done=Math.min(8,1+st.step),current=Math.min(9,2+st.step);
    const action=st.step<3?(CURRENT==='codex'&&Codex.id===FIRST_MISSION_IDS[st.step]?'Record structure insight':'Open candidate'):
      st.step===3?(CURRENT==='lab'&&Lab.mat==='pedot'?'Run highlighted test':'Open Laboratory'):
      st.step===4?(CURRENT==='loadout'&&st.compareReady?'Comparison reviewed':'Open comparison'):
      st.step===5?'Choose from evidence below':'Review decision evidence';
    el.innerHTML=`<div class="fm-card"><div class="fm-head"><span>Guided Mission · ${step.place}</span><b>Action ${current} / 9</b></div>
      <div class="fm-progress" aria-label="${done} completed actions">${Array.from({length:9},(_,i)=>`<i class="${i<done?'done':i===done?'current':''}"></i>`).join('')}</div>
      <h2>${step.title}</h2><dl><div><dt>Investigating</dt><dd>${step.investigate}</dd></div><div><dt>Just learned</dt><dd>${st.lastLearned||'Structure determines how a material carries load and charge.'}</dd></div><div><dt>Why it matters</dt><dd>${step.why}</dd></div></dl>
      <div class="fm-actions"><button class="ctl sm primary" data-fm-action>${action}</button><button class="tiny dim" data-fm-free>Free Exploration</button></div></div>`;
  },
  renderComparison(){
    const detail=$('#cmp-detail');if(!detail)return;let panel=$('#first-mission-decision');
    if(!this.active()||this.state().step<4){if(panel)panel.remove();return;}
    if(!panel){panel=document.createElement('section');panel.id='first-mission-decision';detail.insertAdjacentElement('afterend',panel);}
    const deciding=this.state().step===5;
    panel.innerHTML=`<div class="subplate-title">First Mission evidence</div><h3>Wearable design brief</h3><p class="fm-brief">Choose a lightweight transparent conductor that tolerates bending, provides sufficient conductivity and can be deposited from solution at practical scale.</p>
      <div class="fm-evidence">${FIRST_MISSION_IDS.map(id=>{const e=FIRST_MISSION_EVIDENCE[id];return `<article style="--candidate:${MATERIALS[id].color}"><h4>${e.name}</h4><p><b>Visible structure</b>${e.structure}</p><p><b>Structure → property</b>${e.transport}</p><p><b>Wearable fit</b>${e.fit}</p><p><b>Limitation</b>${e.limit}</p>${deciding?`<button class="ctl sm" data-fm-decision="${id}">Select ${e.name}</button>`:''}</article>`;}).join('')}</div>
      <p class="tiny dim">Qualitative educational decision matrix. Property ranges and primary references remain available in each Codex entry; processing, thickness, substrate and encapsulation change real device performance. Structure references: Novoselov et al. (2004) and Lee et al. (2008) for graphene; Naguib et al. (2011) for Ti₃C₂Tₓ; Groenendaal et al. (2000) for PEDOT.</p>`;
  },
  renderComparisonTable(){
    if(!this.active()||this.state().step<4)return;const tb=$('#cmp-table');if(!tb)return;
    tb.innerHTML=`<tr><th>Mission criterion</th>${FIRST_MISSION_IDS.map(id=>`<th style="color:${MATERIALS[id].color}">${MATERIALS[id].name}</th>`).join('')}</tr>`+
      FIRST_MISSION_COMPARE_ROWS.map(row=>`<tr><td>${row[0]}</td>${row.slice(1).map(value=>`<td>${value}</td>`).join('')}</tr>`).join('');
  },
  decide(id){
    const st=this.state();if(!this.active()||st.step!==5||!FIRST_MISSION_IDS.includes(id))return;
    if(id!=='pedot'){
      const reason=id==='graphene'?'Graphene offers the highest intrinsic performance, but this brief also prioritises scalable solution coating and damage-tolerant film integration.':'MXene combines strong conductivity with printability, but its oxidation and humidity stability are a larger risk for this unprotected wearable brief.';
      openModal(`<div class="panel-title">Trade-off review — ${MATERIALS[id].name}</div><div class="panel-body"><h3 class="display" style="font-size:27px">Strong candidate, not the best fit for this brief.</h3><p style="margin-top:12px;line-height:1.75;color:var(--pearl-dim)">${reason}</p><p class="tiny dim" style="margin-top:10px">Change the service requirements and this candidate could become the correct choice. Here, revisit flexibility, coating process and environmental stability together.</p></div>`);return;
    }
    st.decision='pedot';st.lastLearned=FIRST_MISSION_STEPS[5].insight;st.step=6;this.commit();this.render();this.showEvidence();
  },
  showEvidence(){
    openModal(`<div class="panel-title">Evidence-based decision</div><div class="panel-body"><h3 class="display" style="font-size:30px">PEDOT:PSS best fits the stated wearable brief.</h3>
      <p style="margin:12px 0;line-height:1.75;color:var(--pearl-dim)">Its doped conjugated polymer domains provide sufficient electrical transport while the polymer film remains flexible, transparent and directly coatable from an aqueous dispersion. Graphene offers much higher intrinsic conductivity and strength, while MXene offers a compelling conductive ink; both carry larger integration or environmental-stability penalties for this specific brief.</p>
      <div class="notice">Engineering condition: encapsulate PEDOT:PSS against humidity and verify the chosen formulation by cyclic bend and electrical resistance testing.</div>
      <p class="tiny dim" style="margin-top:12px">Simplification: this mission compares representative literature ranges and structural behaviour. It does not model a specific device geometry, formulation, substrate or lifetime.</p>
      <button class="ctl primary" style="margin-top:16px" data-fm-collect>Add PEDOT:PSS to Collection</button></div>`);
  },
  collect(){
    const st=this.state();if(!this.active()||st.step!==6||st.decision!=='pedot')return;closeModal();
    if(!S.discovered.pedot)discover('pedot','First Mission engineering selection');
    st.status='complete';st.step=7;st.lastLearned=FIRST_MISSION_STEPS[6].insight;st.screen='collection';this.commit();this.syncFocus();renderCollection();nav('collection');setTimeout(()=>collDetail('pedot'),80);this.render();
    Sound.discover();logEntry('First Mission complete — PEDOT:PSS selected for the wearable device with encapsulation required.','opal');
  }
};

window.FirstMission=FirstMission;
