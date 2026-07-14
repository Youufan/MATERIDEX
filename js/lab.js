'use strict';
/* ════════════════════════════════════════════════════════════
   LAB · TENSILE PROTOCOL
   One authoritative selectedMaterial. A physical specimen with a
   visible boundary. Material-specific internal structure.
   View modes: Structure · Continuum · Combined · Damage
   ════════════════════════════════════════════════════════════ */
function structureKind(id){ const f=MATERIALS[id].family;
  if(id==='graphene'||id==='mxene') return 'hex';
  if(['cnt','cfrp','kevlar','cellulose'].includes(id)) return 'fibre';
  if(f==='metal'||id==='nitinol'||id==='liquidmetal') return 'metal';
  if(f==='ceramic'||f==='semi'||f==='energy'||id==='diamond') return 'ceramic';
  return 'polymer'; }
const KIND_DEFECT={hex:'vacancy defect',fibre:'fibre-break cluster',metal:'grain-boundary void',
  ceramic:'critical flaw',polymer:'craze nucleus'};

const Lab={ mat:'graphene', running:false, t:0, T:25, dt:.016, history:[], eventFired:false, done:false, view:'combined',
  params:{temp:300,defect:.9,layers:1,grain:27,rate:1}, mitigated:false, guided:false,
  defectSites:[], grains:null, fibres:null, chains:null, specks:null,

/* ---------- single source of truth ---------- */
setMaterial(id){ if(!MATERIALS[id]||!MATERIALS[id].sim){ toast('No tensile protocol for this material yet','verm','alert'); return false; }
  if(!S.discovered[id]){ toast('Scan '+MATERIALS[id].name+' before running lab protocols','verm','alert'); return false; }
  this.mat=id; this.rebuildSel(); this.applyRanges(); this.reset(true); this.updateMaterialUI();
  if(window.Quests) Quests.event('lab-material',{id});
  return true; },
rebuildSel(){ const sel=$('#lab-material'); if(!sel) return;
  const opts=MAT_LIST.filter(id=>S.discovered[id]&&MATERIALS[id].sim);
  if(!opts.length) opts.push('graphene');
  if(!opts.includes(this.mat)) this.mat=opts[0];
  sel.innerHTML=opts.map(id=>`<option value="${id}">${MATERIALS[id].name}</option>`).join('');
  sel.value=this.mat; },
tempCeilK(){ const m=MATERIALS[this.mat]; return clamp(Math.round((m.load.tmax+273)*1.5/10)*10,400,3400); },
serviceCeilK(){ return Math.round(MATERIALS[this.mat].load.tmax+273); },
applyRanges(){ const tc=this.tempCeilK(); const el=$('#lc-temp'); if(!el) return;
  el.max=tc; if(+el.value>tc){ el.value=Math.min(300,tc); this.params.temp=+el.value; }
  $('#lv-temp').textContent=this.params.temp+' K';
  const gr=$('#lc-grain'); const isF=structureKind(this.mat)==='fibre';
  const lay=$('#lc-layers'); lay.disabled = this.mat!=='graphene'&&this.mat!=='mxene';
  $('#lv-layers').parentElement.style.opacity=lay.disabled?.4:1; },
updateMaterialUI(){ const m=MATERIALS[this.mat]; const kind=structureKind(this.mat);
  const kindNote={hex:'2D lattice — watch individual bonds carry the load.',
    fibre:'fibre-reinforced — strength follows orientation; expect fibre breaks and debonding.',
    metal:'crystalline grains — expect yield, slip and necking before rupture.',
    ceramic:'brittle crystalline solid — a single flaw decides everything.',
    polymer:'entangled chains — they align, then craze, then part.'}[kind];
  $('#lab-mat-note').textContent=`${m.name} — ${kindNote} Service ceiling ≈ ${this.serviceCeilK()} K; beyond it the model shows accelerated degradation. Educational model, not an engineering prediction.`;
  $('#lab-insight').textContent='Configure the specimen and run the tensile protocol. Each control reshapes the response — temperature softens, defects seed damage, orientation steers it.';
  this.renderOutcomes(); },

/* ---------- physics model (unchanged science, per-material ranges) ---------- */
model(){ const m=MATERIALS[this.mat].sim, p=this.params;
  let uts=m.uts, ef=m.failStrain;
  const svc=this.serviceCeilK();
  const defectF = 1 - clamp(p.defect,0,5)*.13;
  let tempF = 1 - clamp((p.temp-300)/3000,-.1,.65)*.55;
  const over = p.temp>svc? clamp((p.temp-svc)/svc,0,1) : 0;   // beyond service: collapse
  tempF *= (1-over*.85);
  const coldBr = p.temp<150 ? .92 : 1;
  const grainF = 1 - Math.abs(Math.sin(p.grain*Math.PI/30))*.12;
  const layerF = (this.mat==='graphene'||this.mat==='mxene')? (1-(p.layers-1)*.035) : 1;
  const rateF  = 1 + Math.log10(clamp(p.rate,.01,10))*.03;
  uts *= defectF*tempF*grainF*layerF*rateF*coldBr;
  ef  *= defectF*(2-tempF)*grainF*(m.ductile?1:coldBr);
  if(this.mitigated){ uts*=1.14; ef*=1.12; }
  const E=m.E*(1-(p.temp-300)/6000);
  const conf=clamp(96 - p.defect*3 - Math.abs(p.temp-300)/60 - (p.layers-1)*1.2 - over*25, 40, 97);
  return {uts:Math.max(uts,.0001), ef:Math.max(ef,.001), E, conf, ductile:m.ductile, over}; },
stressAt(eps){ const M=this.model();
  const eY=M.ductile? M.ef*.35 : M.ef*.98;
  if(eps<=eY) return Math.min(M.uts,M.E*eps);
  if(!M.ductile) return eps<M.ef? M.E*eps : 0;
  if(eps<M.ef){ const t=(eps-eY)/(M.ef-eY); return M.uts*(0.75+.25*Math.sin(t*Math.PI*.5+.2)); }
  return 0; },
epsAt(t){ const M=this.model(); return (t/this.T)*M.ef*1.15; },

/* ---------- init ---------- */
init(){ this.cv=$('#lab-canvas'); this.ctx=this.cv.getContext('2d');
  this.ss=$('#chart-ss'); this.heat=$('#chart-heat');
  // view-specimen chips overlaid on stage
  const vb=document.createElement('div');
  vb.id='lab-viewbar';
  vb.style.cssText='position:absolute;top:12px;left:14px;z-index:5;display:flex;gap:5px;align-items:center';
  vb.innerHTML='<span class="eyebrow" style="margin-right:4px">View specimen</span>'+
    ['structure','continuum','combined','damage'].map(v=>
      `<button class="chip ${v==='combined'?'on':''}" data-labview="${v}">${v}</button>`).join('');
  $('#lab-stage').appendChild(vb);
  $$('#lab-viewbar [data-labview]').forEach(b=>b.addEventListener('click',()=>{
    $$('#lab-viewbar .chip').forEach(x=>x.classList.remove('on')); b.classList.add('on');
    this.view=b.dataset.labview; Sound.click(); }));
  // controls
  $('#lc-temp').addEventListener('input',e=>{ this.params.temp=+e.target.value;
    const svc=this.serviceCeilK();
    $('#lv-temp').textContent=this.params.temp+' K'+(this.params.temp>svc?' ⚠':'');
    $('#lv-temp').style.color=this.params.temp>svc?'var(--verm)':'';
    if(!this.running) this.reset(false); this.renderOutcomes(); });
  $('#lc-defect').addEventListener('input',e=>{ this.params.defect=+e.target.value;
    $('#lv-defect').textContent=this.params.defect.toFixed(1)+' %';
    if(!this.running) this.reset(false); this.renderOutcomes(); });
  $('#lc-layers').addEventListener('input',e=>{ this.params.layers=+e.target.value;
    $('#lv-layers').textContent=e.target.value; if(!this.running) this.reset(false); this.renderOutcomes(); });
  $('#lc-grain').addEventListener('input',e=>{ this.params.grain=+e.target.value;
    $('#lv-grain').textContent=e.target.value+'°'; if(!this.running) this.reset(false); this.renderOutcomes(); });
  $('#lc-rate').addEventListener('input',e=>{ const v=Math.pow(10,+e.target.value);
    this.params.rate=v; $('#lv-rate').textContent=v.toFixed(2)+' nm/s';
    if(!this.running) this.reset(false); this.renderOutcomes(); });
  // transport
  $('#sim-run').addEventListener('click',()=>this.run());
  $('#sim-pause').addEventListener('click',()=>{ this.running=false; Sound.click(); });
  $('#sim-step').addEventListener('click',()=>{ this.running=false; this.tick(.25); Sound.click(); });
  $('#sim-reset').addEventListener('click',()=>{ this.reset(true); Sound.click(); });
  $('#sim-save').addEventListener('click',()=>this.saveResult());
  $('#sim-scrub').addEventListener('input',e=>{ this.running=false;
    this.t=+e.target.value/1000*this.T; this.syncClock(); });
  $('#lab-material').addEventListener('change',e=>this.setMaterial(e.target.value));
  this.rebuildSel(); this.applyRanges(); this.reset(true); this.updateMaterialUI();
  this.loop(); this.renderResults(); },
setGuided(on){ this.guided=on;
  const rows=$$('#lab-left .slider-row');
  rows.forEach((r,i)=>{ r.style.display=(on&&i!==1)?'none':''; });   // guided: defect density only
  $('#lab-material').parentElement.parentElement.style.display=on?'none':''; },

/* ---------- structure seeds ---------- */
seedStructures(){ let seed=42+this.params.defect*7+this.params.grain+this.mat.length*13;
  const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed%100000)/100000; };
  const nD=Math.round(this.params.defect*2)+1;
  this.defectSites=[]; for(let i=0;i<nD;i++) this.defectSites.push({x:.15+rnd()*.7, y:.15+rnd()*.7});
  this.crackSite=this.defectSites[0]||{x:.5,y:.5};
  // metal grains — jittered grid polygons (normalized gauge coords)
  this.grains=[]; const gc=9,gr=4;
  const corner={}; for(let i=0;i<=gc;i++) for(let j=0;j<=gr;j++)
    corner[i+'_'+j]=[i/gc+(i>0&&i<gc?(rnd()-.5)*.07:0), j/gr+(j>0&&j<gr?(rnd()-.5)*.14:0)];
  for(let i=0;i<gc;i++) for(let j=0;j<gr;j++)
    this.grains.push({pts:[corner[i+'_'+j],corner[(i+1)+'_'+j],corner[(i+1)+'_'+(j+1)],corner[i+'_'+(j+1)]],
      slip:rnd()*Math.PI, ph:rnd()});
  // fibres
  this.fibres=[]; for(let i=0;i<24;i++) this.fibres.push({y:(i+.5)/24, breakAt:.55+rnd()*.55, bx:.2+rnd()*.6, ph:rnd()});
  // polymer chains
  this.chains=[]; for(let i=0;i<15;i++){ const pts=[];
    for(let k=0;k<=14;k++) pts.push(rnd()-.5); this.chains.push({y:(i+.5)/15,amps:pts,ph:rnd()}); }
  // ceramic speckle
  this.specks=[]; for(let i=0;i<130;i++) this.specks.push({x:rnd(),y:rnd(),r:.4+rnd()*1.3,a:rnd()*Math.PI}); },

reset(hard){ this.t=0; this.running=false; this.eventFired=false; this.done=false; this.history=[];
  if(hard) this.mitigated=false;
  this.seedStructures();
  $('#lab-alert').classList.remove('on'); $('#lab-event').style.display='none';
  const lst=$('#lab-stage'); if(lst) lst.classList.remove('crit');
  this.syncClock(); this.renderOutcomes(); },
run(){ if(this.done) this.reset(false); this.running=true; Sound.click();
  $('#lab-event').style.display='none'; },
tick(mult=1){ const M=this.model();
  const speed=this.T/(22/Math.sqrt(clamp(this.params.rate,.05,10)));
  this.t=Math.min(this.T,this.t+this.dt*speed*mult*4);
  const eps=this.epsAt(this.t);
  if(!this.eventFired&&eps>M.ef*.68){ this.eventFired=true; this.running=false; this.criticalEvent(); }
  if(eps>=M.ef&&!this.done){ this.done=true; this.running=false; this.fail(); }
  this.syncClock(); },
criticalEvent(){ Sound.alert(); $('#lab-alert').classList.add('on'); $('#lab-stage').classList.add('crit');
  const dName=KIND_DEFECT[structureKind(this.mat)];
  $('#lab-alert-text').textContent='Critical damage propagation detected';
  const box=$('#lab-event'); box.style.display='block';
  $('#lab-event-text').textContent=`Damage growth accelerating beyond threshold at strain ${(this.epsAt(this.t)*100).toFixed(1)}%. A ${dName} is initiating failure along a high-strain path.`;
  const CH=[
    {t:'Inspect damage zone',s:'analyse the mechanism · +40 XP',f:()=>{ grant('defect_det'); addXP(40,'· damage-zone analysis');
      if(window.Quests&&Quests.event) Quests.event('defect-inspect',{id:this.mat});
      $('#lab-insight').textContent={hex:'At the crack tip, bonds carry several times the far-field load. In brittle lattices the tip stays atomically sharp — nothing blunts it, so it runs.',
        fibre:'Fibres bridge the crack until they snap one by one; each break dumps load onto its neighbours. The interface decides whether cracks deflect or cut straight through.',
        metal:'Voids nucleate at grain boundaries, grow, and link. Ductile metals buy time by blunting the tip with plastic flow — that is what the neck is.',
        ceramic:'The flaw was always there; stress found it. With no plasticity to blunt it, the crack accelerates toward the sound speed of the material.',
        polymer:'Chains align, then fibrillate into a craze — a crack bridged by nanoscale ligaments. When the fibrils rupture, the craze becomes a true crack.'}[structureKind(this.mat)];
      this.resume(); }},
    {t:'Reinforce damage site',s:'local stabilisation · 60 credits',f:()=>{ if(!spendCredits(60)) return;
      this.mitigated=true; toast('Damage site reinforced — predicted strength +14%'); this.resume(); }},
    {t:'Reduce loading rate',s:'drop to 0.10 nm/s — gentler, slower',f:()=>{ $('#lc-rate').value=-1; this.params.rate=.1;
      $('#lv-rate').textContent='0.10 nm/s';
      $('#lab-insight').textContent='Slower loading gives thermally activated processes time to blunt stress concentrations — a modest gain here, decisive in viscoelastic materials.';
      this.resume(); }},
    {t:'Continue until failure',s:'let it run — observe the fracture',f:()=>this.resume()}];
  $('#lab-event-choices').innerHTML=CH.map((c,i)=>`<button class="evt-choice" data-ec="${i}"><span>${c.t}</span><small>${c.s}</small></button>`).join('');
  $$('#lab-event-choices [data-ec]').forEach(b=>b.addEventListener('click',()=>CH[+b.dataset.ec].f())); },
resume(){ $('#lab-event').style.display='none'; $('#lab-alert').classList.remove('on');
  $('#lab-stage').classList.remove('crit'); this.running=true; },
fail(){ Sound.fail(); const M=this.model();
  $('#lab-alert').classList.add('on'); $('#lab-alert-text').textContent='Fracture — specimen separated';
  const kind=structureKind(this.mat);
  $('#lab-insight').textContent=`Failure at ${(M.ef*100).toFixed(1)}% strain, ${this.fmtStress(M.uts)}. `+
    {hex:'The crack unzipped the lattice bond by bond.',fibre:'Fibre breaks coalesced; the matrix could no longer shuttle load around them.',
     metal:'Necking localised the strain until voids linked into a ductile tear.',
     ceramic:'Brittle rupture — the flaw ran the instant coalescence completed.',
     polymer:'Crazes coalesced; the aligned chains pulled free.'}[kind]+
    (M.over?' Operating beyond the service ceiling degraded the material before the test even loaded it.':'')+
    (this.mitigated?' Reinforcing the damage site bought measurable extra life.':'');
  S.sims++; addMastery(this.mat,60); addXP(50,'· simulation completed'); checkAchievements();
  if(this.guided) this.setGuided(false);
  logEntry(`Tensile protocol on ${MATERIALS[this.mat].name}: UTS ${this.fmtStress(M.uts)}, failure strain ${(M.ef*100).toFixed(1)}%.`,'verm');
  if(window.Quests) Quests.event('sim-complete',{id:this.mat,defect:this.params.defect}); },
fmtStress(gpa){ return gpa>=1? gpa.toFixed(1)+' GPa' : (gpa*1000).toFixed(gpa>.01?0:2)+' MPa'; },
saveResult(){ const M=this.model();
  S.simResults.unshift({mat:this.mat,t:Date.now(),uts:M.uts,ef:M.ef,conf:M.conf,params:{...this.params},mit:this.mitigated});
  S.simResults=S.simResults.slice(0,8); save(); this.renderResults();
  toast('Result saved to research log');
  logEntry(`Saved result — ${MATERIALS[this.mat].name} tensile test (confidence ${M.conf.toFixed(1)}%).`);
  if(window.Quests) Quests.event('sim-saved',{id:this.mat}); },
renderResults(){ const el=$('#lab-results');
  el.innerHTML=S.simResults.length? S.simResults.map(r=>`<div class="kv" title="${new Date(r.t).toLocaleString()}">
    <span>${MATERIALS[r.mat].name}${r.mit?' ◆':''}</span><b>${this.fmtStress(r.uts)} · ${(r.ef*100).toFixed(1)}%</b></div>`).join('')
    +'<p class="tiny dim" style="margin-top:6px">◆ = damage mitigated during run</p>'
  : '<p class="tiny dim">No results saved.</p>'; },
renderOutcomes(){ const M=this.model(); const m=MATERIALS[this.mat];
  $('#lab-outcomes').innerHTML=`
    <div class="kv" style="border:none;padding-bottom:2px"><span>Specimen</span><b>${m.name}</b></div>
    ${M.over?'<div class="notice verm" style="padding:8px 12px;font-size:10px;margin:6px 0">Beyond service ceiling — material degrading before load</div>':''}
    <div class="outcome"><span>Tensile strength</span><b>${this.fmtStress(M.uts)}<small>±${(M.uts*.028).toFixed(M.uts>1?1:3)}</small></b></div>
    <div class="outcome"><span>Failure strain</span><b>${(M.ef*100).toFixed(1)} %<small>±1.2</small></b></div>
    <div class="outcome"><span>Stiffness</span><b>${M.E>=1?M.E.toFixed(0)+' GPa':(M.E*1000).toFixed(1)+' MPa'}</b></div>
    <div class="outcome"><span>Conductivity change</span><b>${m.sim.conduct? (-(this.params.defect*3+((this.epsAt(this.t)/Math.max(M.ef,.001))*9)).toFixed(1))+' %':'n/a'}</b></div>
    <div class="outcome"><span>Confidence</span><b>${M.conf.toFixed(1)} %</b></div>
    <p class="tiny dim" style="margin-top:8px">Simulation outputs — simplified educational model.</p>`; },
syncClock(){ $('#sim-clock').textContent=this.t.toFixed(3).padStart(6,'0')+' s';
  $('#sim-endclock').textContent='/ '+this.T.toFixed(0)+'.000 s';
  $('#sim-scrub').value=this.t/this.T*1000; },
loop(){ requestAnimationFrame(()=>this.loop());
  if(CURRENT!=='lab') return;
  if(this.running) this.tick();
  const eps=this.epsAt(this.t), M=this.model();
  if(this.running&&this.t>0&&(this.history.length===0||this.history[this.history.length-1].t<this.t))
    this.history.push({t:this.t,eps,s:this.stressAt(eps)});
  this.drawStage(eps,M); this.drawSS(eps,M); this.drawHeat(eps,M);
  if(this.running&&(this._outT=(this._outT||0)+1)%12===0) this.renderOutcomes(); },

/* ════════ SPECIMEN RENDERING ════════ */
/* dog-bone half-width in normalized gauge x∈[0..1]; tabs beyond */
halfW(u){ const tab=.14, fil=.12;
  if(u<tab||u>1-tab) return 1;
  const d=Math.min(u-tab,1-tab-u);
  if(d<fil) return 1-(1-.62)*(0.5-0.5*Math.cos(Math.PI*d/fil));
  return .62; },
drawStage(eps,M){ const cv=this.cv,wrap=$('#lab-stage');
  const w=wrap.clientWidth,h=wrap.clientHeight; if(!w) return;
  if(cv.width!==w*PR){ cv.width=w*PR; cv.height=h*PR; }
  const ctx=this.ctx; ctx.setTransform(PR,0,0,PR,0,0); ctx.clearRect(0,0,w,h);
  const m=MATERIALS[this.mat]; const t=now()/1000; const kind=structureKind(this.mat);
  const rm=document.documentElement.dataset.motion==='reduced';
  const prog=clamp(eps/Math.max(M.ef,.0001),0,1);
  const crackP=clamp((prog-.68)/.32,0,1)**(kind==='ceramic'?.45:1);
  const sep=this.done? 14 : 0;
  const pad=86, gW0=w-pad*2, gH0=Math.min(h-150,gW0*.3);
  const oy=(h-gH0)/2+8;
  const gW=gW0*(1+eps*.9);                       // visible elongation (display-compressed)
  const nu = M.ductile? .42 : .18;
  const ox=pad-(gW-gW0)/2;                       // stretch symmetrically
  const cs=this.crackSite;
  const neckAmp = M.ductile? clamp((prog-.5)*.7,0,.4) : 0;
  const xw=(u)=>{ // deformed half width at u (0..1)
    let hw=this.halfW(u)*gH0/2*(1-nu*eps*(this.halfW(u)<.99?1:.25));
    if(neckAmp) hw*=1-neckAmp*Math.exp(-((u-cs.x)**2)/.012);
    // defect boundary distortion
    this.defectSites.forEach(d=>{ hw-=3.2*prog*Math.exp(-((u-d.x)**2)/.0035); });
    return hw; };
  const U=(u)=>ox+u*gW;
  /* critical-event camera */
  this.zoomF=lerp(this.zoomF||1,(this.eventFired&&!this.running&&!this.done)?1.5:1,.06);
  const fX=U(cs.x), fY=oy+gH0/2;
  ctx.save();
  if(this.zoomF>1.01){ ctx.translate(fX,fY); ctx.scale(this.zoomF,this.zoomF); ctx.translate(-fX,-fY); }
  /* chamber light */
  const amb=ctx.createRadialGradient(w/2,oy+gH0/2,10,w/2,oy+gH0/2,gW0*.75);
  amb.addColorStop(0,this.eventFired&&!this.done?'rgba(140,50,30,.14)':'rgba(74,62,140,.2)');
  amb.addColorStop(1,'transparent'); ctx.fillStyle=amb; ctx.fillRect(0,0,w,h);
  /* undeformed reference outline */
  ctx.setLineDash([3,5]); ctx.strokeStyle='rgba(235,229,215,.16)'; ctx.beginPath();
  for(let i=0;i<=60;i++){ const u=i/60; const x=pad+u*gW0, y=oy+gH0/2-this.halfW(u)*gH0/2;
    i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
  for(let i=60;i>=0;i--){ const u=i/60; ctx.lineTo(pad+u*gW0,oy+gH0/2+this.halfW(u)*gH0/2); }
  ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  /* deformed outline paths (two halves if separated) */
  const buildOutline=(u0,u1,shift)=>{ const p=new Path2D();
    for(let i=0;i<=48;i++){ const u=u0+(u1-u0)*i/48;
      const x=U(u)+shift, y=oy+gH0/2-xw(u);
      i?p.lineTo(x,y):p.moveTo(x,y); }
    for(let i=48;i>=0;i--){ const u=u0+(u1-u0)*i/48;
      p.lineTo(U(u)+shift,oy+gH0/2+xw(u)); }
    p.closePath(); return p; };
  const halves = sep? [buildOutline(0,cs.x,-sep/2),buildOutline(cs.x,1,sep/2)] : [buildOutline(0,1,0)];
  const bodyOn = this.view!=='structure';
  const strucOn = this.view!=='continuum';
  halves.forEach((path,hi)=>{
    if(bodyOn){ /* translucent membrane body */
      const bg=ctx.createLinearGradient(0,oy,0,oy+gH0);
      const strainGlow=this.view==='damage'? .04 : .1;
      bg.addColorStop(0,`rgba(205,188,247,${strainGlow+prog*.05})`);
      bg.addColorStop(.5,`rgba(80,70,150,${strainGlow*.8+prog*.04})`);
      bg.addColorStop(1,`rgba(147,220,244,${strainGlow*.7})`);
      ctx.fillStyle=bg; ctx.fill(path);
      if(this.view!=='structure'){ /* continuum strain field wash */
        ctx.save(); ctx.clip(path);
        const sf=ctx.createRadialGradient(U(cs.x),oy+gH0/2,4,U(cs.x),oy+gH0/2,gW*.45);
        sf.addColorStop(0,`rgba(255,120,70,${prog*.32})`);
        sf.addColorStop(.4,`rgba(190,90,200,${prog*.14})`);
        sf.addColorStop(1,'transparent');
        ctx.fillStyle=sf; ctx.fillRect(0,0,w,h); ctx.restore(); } }
    /* internal structure clipped to the body */
    if(strucOn){ ctx.save(); ctx.clip(path);
      this.drawInternals(ctx,kind,{U,xw,oy,gH0,gW,eps,prog,crackP,t,rm,shift:hi?sep/2:(sep?-sep/2:0),m});
      ctx.restore(); }
    /* illuminated edges */
    ctx.strokeStyle=this.view==='damage'?'rgba(255,150,110,.55)':'rgba(246,242,234,.6)';
    ctx.lineWidth=1.2; ctx.shadowColor=this.view==='damage'?'#ff5a36':'#cdbcf7'; ctx.shadowBlur=6;
    ctx.stroke(path); ctx.shadowBlur=0; ctx.lineWidth=1; });
  /* crack cutting the boundary */
  if(crackP>0&&!sep){ ctx.strokeStyle='rgba(255,90,54,.95)'; ctx.lineWidth=1.6;
    ctx.shadowColor='#ff5a36'; ctx.shadowBlur=10;
    ctx.beginPath(); const cx0=U(cs.x);
    let px=cx0, py=oy+gH0/2+xw(cs.x)*(1-2*cs.y);
    ctx.moveTo(px,py);
    const reach=crackP*xw(cs.x)*2.1;
    for(let k=1;k<=8;k++){ const yy=py-(reach*k/8)*(cs.y>.5?1:-1)*-1;
      px=cx0+Math.sin(k*2.1+this.params.grain)*4; ctx.lineTo(px,py+(k/8)*reach*(cs.y>.5?-1:1)); }
    ctx.stroke(); ctx.shadowBlur=0; ctx.lineWidth=1;
    const g2=ctx.createRadialGradient(cx0,fY,2,cx0,fY,30);
    g2.addColorStop(0,'rgba(255,120,60,.7)'); g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(cx0,fY,30,0,7); ctx.fill(); }
  /* grips — drawn over specimen tabs */
  [[U(0)-46,1],[U(1)+(sep?sep/2:0),-1]].forEach(([gx,dir],gi)=>{
    if(gi===0) gx=U(0)-46+(sep?-sep/2:0);
    const gw=46, gh=gH0+44, gy=oy-22;
    const mg=ctx.createLinearGradient(gx,gy,gx+gw,gy);
    mg.addColorStop(0,'#3a3d4c'); mg.addColorStop(.18,'#c9ccda'); mg.addColorStop(.38,'#6e7284');
    mg.addColorStop(.6,'#23252f'); mg.addColorStop(.85,'#8a8ea0'); mg.addColorStop(1,'#40434f');
    ctx.fillStyle=mg;
    ctx.beginPath(); ctx.roundRect? ctx.roundRect(gx,gy,gw,gh,10):ctx.rect(gx,gy,gw,gh); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.stroke();
    ctx.fillStyle='rgba(14,14,22,.95)';
    for(let k=0;k<6;k++){ const ty=gy+10+k*(gh-20)/5; ctx.fillRect(dir>0?gx+gw-7:gx,ty,7,4); }
    for(let k=0;k<3;k++){ const by=gy+gh*.2+k*gh*.3;
      const bg2=ctx.createRadialGradient(gx+gw*.4-2,by-2,1,gx+gw*.4,by,5);
      bg2.addColorStop(0,'#f4f2fa'); bg2.addColorStop(.5,'#7c8092'); bg2.addColorStop(1,'#22242e');
      ctx.fillStyle=bg2; ctx.beginPath(); ctx.arc(gx+gw*.4,by,4.5,0,7); ctx.fill(); }
    ctx.fillStyle=this.running?'rgba(147,220,244,.95)':'rgba(139,108,240,.6)';
    ctx.shadowColor='#93dcf4'; ctx.shadowBlur=9;
    ctx.beginPath(); ctx.arc(gx+gw*.4,gy+gh-12,2.6,0,7); ctx.fill(); ctx.shadowBlur=0; });
  /* force vectors */
  ctx.strokeStyle='#8b6cf0'; ctx.fillStyle='#8b6cf0'; ctx.lineWidth=2;
  const ar=(x,dir)=>{ ctx.beginPath(); ctx.moveTo(x,fY); ctx.lineTo(x+26*dir,fY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+26*dir,fY-5); ctx.lineTo(x+34*dir,fY); ctx.lineTo(x+26*dir,fY+5);
    ctx.closePath(); ctx.fill(); };
  ar(U(0)-56,-1); ar(U(1)+52,1); ctx.lineWidth=1;
  ctx.restore();
  /* dimension markers */
  ctx.strokeStyle='rgba(163,156,141,.35)'; ctx.fillStyle='rgba(163,156,141,.8)';
  ctx.font='10px "IBM Plex Mono"'; ctx.textAlign='center';
  ctx.beginPath(); ctx.moveTo(U(0),oy+gH0+26); ctx.lineTo(U(1),oy+gH0+26); ctx.stroke();
  ctx.fillText('L = '+(5.27*(1+eps)).toFixed(2)+' nm'+(eps>0?'  (+'+(eps*100).toFixed(1)+'%)':''),w/2,oy+gH0+40);
  const wNow=(xw(.5)*2/gH0/.62)*1.32;
  ctx.save(); ctx.translate(U(1)+30,fY); ctx.rotate(-Math.PI/2);
  ctx.fillText('w = '+wNow.toFixed(2)+' nm',0,0); ctx.restore();
  /* header */
  ctx.fillStyle='rgba(246,242,234,.85)'; ctx.font='10.5px "Archivo Narrow"';
  ctx.fillText(('TENSILE TEST — '+m.name+'  ·  ε = '+(eps*100).toFixed(1)+'%'+(this.done?'  ·  FRACTURED':'')).toUpperCase(),w/2,26); },

drawInternals(ctx,kind,o){ const {U,xw,oy,gH0,eps,prog,crackP,t,rm,m}=o;
  const yC=oy+gH0/2;
  const dim=this.view==='damage'? .3 : 1;
  if(kind==='hex'){ /* honeycomb lattice */
    const a=11*(1+eps*.9), ay=11*.87*(1-.3*eps);
    ctx.strokeStyle=`rgba(205,188,247,${.55*dim})`; ctx.lineWidth=1;
    const u0x=U(0);
    for(let r=-6;r<=6;r++) for(let c=0;c<Math.ceil((U(1)-U(0))/(a*1.5))+1;c++){
      const x=u0x+c*a*1.5+(r%2?a*.75:0), y=yC+r*ay;
      if(y<oy-8||y>oy+gH0+8) continue;
      const u=clamp((x-U(0))/(U(1)-U(0)),0,1);
      const localStrain=prog*(1+2*Math.exp(-((u-this.crackSite.x)**2)/.02));
      const rr=Math.round(160+clamp(localStrain,0,1.4)*95), bb=Math.round(247-clamp(localStrain,0,1.4)*150);
      ctx.strokeStyle=`rgba(${rr},${Math.round(150-localStrain*40)},${bb},${(.4+localStrain*.3)*dim})`;
      ctx.beginPath();
      for(let k=0;k<6;k++){ const an=k*Math.PI/3+Math.PI/6;
        const px=x+Math.cos(an)*a*.55, py=y+Math.sin(an)*ay*.6+(rm?0:Math.sin(t*2.4+c+r)*.7);
        k?ctx.lineTo(px,py):ctx.moveTo(px,py); }
      ctx.closePath(); ctx.stroke(); }
    this.defectSites.forEach(d=>{ const x=U(d.x), y=oy+d.y*gH0;
      ctx.fillStyle=`rgba(255,90,54,${.7+.3*(rm?0:Math.sin(t*5))})`;
      ctx.shadowColor='#ff5a36'; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(x,y,3.4,0,7); ctx.fill(); ctx.shadowBlur=0; }); }
  else if(kind==='fibre'){ /* fibres + matrix */
    const ang=(this.params.grain-30)/30*.25;
    ctx.fillStyle=`rgba(120,110,160,${.12*dim})`;
    for(let i=0;i<70;i++){ const fx=U((i*37%100)/100), fy=oy+((i*61)%100)/100*gH0;
      ctx.fillRect(fx,fy,2,2); }
    this.fibres.forEach((f,i)=>{ const y=oy+f.y*gH0;
      const broken=prog>f.breakAt;
      ctx.strokeStyle=broken? `rgba(255,140,100,${.5*dim})` : `rgba(${190+i%3*20},${180+i%2*30},220,${.6*dim})`;
      ctx.lineWidth=2.2;
      if(!broken){ ctx.beginPath(); ctx.moveTo(U(0),y-ang*(U(1)-U(0))/2);
        ctx.lineTo(U(1),y+ang*(U(1)-U(0))/2); ctx.stroke(); }
      else{ const bx=U(f.bx);
        ctx.beginPath(); ctx.moveTo(U(0),y-ang*40); ctx.lineTo(bx-4-prog*6,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+4+prog*6,y); ctx.lineTo(U(1),y+ang*40); ctx.stroke();
        ctx.fillStyle='rgba(255,170,130,.85)'; ctx.beginPath(); ctx.arc(bx,y,2.4,0,7); ctx.fill();
        /* debond streaks */
        ctx.strokeStyle=`rgba(246,242,234,${.3*dim})`; ctx.lineWidth=.8;
        ctx.beginPath(); ctx.moveTo(bx-16,y-3); ctx.lineTo(bx+16,y-3);
        ctx.moveTo(bx-16,y+3); ctx.lineTo(bx+16,y+3); ctx.stroke(); } });
    if(this.mat==='cfrp'&&prog>.8){ /* delamination bands */
      ctx.strokeStyle=`rgba(255,110,80,${(prog-.8)*3*dim})`; ctx.lineWidth=1.4;
      [0.33,0.66].forEach(fy=>{ const y=oy+fy*gH0;
        ctx.beginPath(); ctx.moveTo(U(.2),y); ctx.lineTo(U(.8),y); ctx.stroke(); }); }
    ctx.lineWidth=1; }
  else if(kind==='metal'){ /* grains + slip + boundaries */
    this.grains.forEach(g=>{ ctx.beginPath();
      g.pts.forEach(([gx,gy],i)=>{ const x=U(gx), y=oy+gy*gH0;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
      ctx.closePath();
      ctx.fillStyle=`rgba(${150+g.ph*40|0},${150+g.ph*30|0},${175+g.ph*30|0},${.1*dim})`;
      ctx.fill();
      ctx.strokeStyle=`rgba(200,204,220,${.35*dim})`; ctx.stroke();
      const yieldP=MATERIALS[this.mat].sim.ductile? .35 : .9;
      if(prog>yieldP){ /* slip traces */
        const c=[(g.pts[0][0]+g.pts[2][0])/2,(g.pts[0][1]+g.pts[2][1])/2];
        const n=Math.min(4,Math.floor((prog-yieldP)*10));
        ctx.strokeStyle=`rgba(147,220,244,${.4*dim})`;
        for(let k=0;k<n;k++){ const off=(k-n/2)*4;
          const cx2=U(c[0]),cy2=oy+c[1]*gH0;
          ctx.beginPath();
          ctx.moveTo(cx2-9*Math.cos(g.slip)+off*Math.sin(g.slip),cy2-9*Math.sin(g.slip)-off*Math.cos(g.slip));
          ctx.lineTo(cx2+9*Math.cos(g.slip)+off*Math.sin(g.slip),cy2+9*Math.sin(g.slip)-off*Math.cos(g.slip));
          ctx.stroke(); } } });
    this.defectSites.forEach(d=>{ if(prog>.5){ const x=U(d.x),y=oy+d.y*gH0;
      ctx.fillStyle=`rgba(255,120,80,${(prog-.5)*1.6*dim})`;
      ctx.beginPath(); ctx.arc(x,y,1.5+prog*3,0,7); ctx.fill(); } }); }
  else if(kind==='ceramic'){ /* granular crystalline + initial flaw */
    this.specks.forEach(sp=>{ const x=U(sp.x), y=oy+sp.y*gH0;
      ctx.save(); ctx.translate(x,y); ctx.rotate(sp.a);
      ctx.strokeStyle=`rgba(${210},${206},${192},${.3*dim})`;
      ctx.strokeRect(-sp.r*2.4,-sp.r*2.4,sp.r*4.8,sp.r*4.8); ctx.restore(); });
    const fl=this.crackSite; const fx=U(fl.x), fy=oy+fl.y*gH0;
    ctx.strokeStyle=`rgba(255,90,54,${.7*dim})`; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(fx-4,fy-4); ctx.lineTo(fx+4,fy+4); ctx.stroke(); ctx.lineWidth=1;
    ctx.fillStyle=`rgba(163,156,141,${.6*dim})`; ctx.font='8px "IBM Plex Mono"'; ctx.textAlign='left';
    if(prog<.4) ctx.fillText('initial flaw',fx+8,fy-4); }
  else{ /* polymer chains aligning */
    const align=clamp(prog*1.4,0,1);
    this.chains.forEach((c,ci)=>{ const y=oy+c.y*gH0;
      ctx.strokeStyle=`rgba(${150+ci%3*30},${216},${170+ci%2*40},${.5*dim})`;
      ctx.lineWidth=1.6; ctx.beginPath();
      for(let k=0;k<=28;k++){ const u=k/28;
        const amp=(1-align)*10*c.amps[k%14]*Math.sin(k*1.7+c.ph*6+(rm?0:t*.8));
        const x=U(u), yy=y+amp;
        k?ctx.lineTo(x,yy):ctx.moveTo(x,yy); }
      ctx.stroke(); });
    if(prog>.7){ /* crazing */
      const cx2=U(this.crackSite.x);
      ctx.strokeStyle=`rgba(246,242,234,${(prog-.7)*2.4*dim})`; ctx.lineWidth=.8;
      for(let k=0;k<10;k++){ const y=yC-xw(this.crackSite.x)+k*(xw(this.crackSite.x)*2/10);
        ctx.beginPath(); ctx.moveTo(cx2-3,y); ctx.lineTo(cx2+3,y); ctx.stroke(); }
      ctx.lineWidth=1; }
    ctx.lineWidth=1; }
  /* damage-mode heat emphasis */
  if(this.view==='damage'){ const cx2=U(this.crackSite.x);
    const g2=ctx.createRadialGradient(cx2,yC,4,cx2,yC,80);
    g2.addColorStop(0,`rgba(255,140,70,${prog*.5})`); g2.addColorStop(.5,`rgba(200,80,160,${prog*.2})`);
    g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2; ctx.fillRect(cx2-90,oy,180,gH0);
    this.defectSites.forEach(d=>{ const x=U(d.x),y=oy+d.y*gH0;
      ctx.strokeStyle='rgba(255,90,54,.8)';
      ctx.beginPath(); ctx.arc(x,y,7+3*(rm?0:Math.sin(t*4)),0,7); ctx.stroke(); }); } },

drawSS(eps,M){ const cv=this.ss; const w=cv.clientWidth,h=cv.clientHeight; if(!w) return;
  if(cv.width!==w*PR){cv.width=w*PR;cv.height=h*PR;}
  const ctx=cv.getContext('2d'); ctx.setTransform(PR,0,0,PR,0,0); ctx.clearRect(0,0,w,h);
  const pad=38, maxE=M.ef*1.2, maxS=M.uts*1.25;
  ctx.strokeStyle='rgba(246,242,234,.12)';
  ctx.beginPath(); ctx.moveTo(pad,h-26); ctx.lineTo(w-8,h-26); ctx.moveTo(pad,h-26); ctx.lineTo(pad,26); ctx.stroke();
  ctx.fillStyle='rgba(163,156,141,.7)'; ctx.font='8px "IBM Plex Mono"'; ctx.textAlign='right';
  ctx.fillText(this.fmtStress(M.uts),pad-3,32); ctx.textAlign='center'; ctx.fillText((maxE*100).toFixed(0)+'%',w-16,h-12);
  ctx.beginPath(); let started=false;
  for(let e=0;e<=Math.min(eps,M.ef);e+=maxE/160){ const s=this.stressAt(e);
    const x=pad+e/maxE*(w-pad-14), y=(h-26)-s/maxS*(h-56);
    started?ctx.lineTo(x,y):ctx.moveTo(x,y); started=true; }
  ctx.strokeStyle='#a78bfa'; ctx.lineWidth=1.8; ctx.shadowColor='#8b6cf0'; ctx.shadowBlur=7; ctx.stroke();
  ctx.shadowBlur=0; ctx.lineWidth=1;
  if(eps>=M.ef){ const x=pad+M.ef/maxE*(w-pad-14);
    ctx.setLineDash([2,3]); ctx.strokeStyle='rgba(255,75,38,.7)';
    ctx.beginPath(); ctx.moveTo(x,(h-26)-this.stressAt(M.ef*.99)/maxS*(h-56)); ctx.lineTo(x+6,h-26); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#ff8a70'; ctx.font='8.5px "Archivo Narrow"'; ctx.textAlign='left';
    ctx.fillText('FRACTURE',x+8,h-56); }
  ctx.fillStyle='rgba(235,229,215,.6)'; ctx.font='8.5px "Archivo Narrow"'; ctx.textAlign='left';
  if(M.ductile) ctx.fillText('YIELD',pad+M.ef*.35/maxE*(w-pad-14),40);
  const e=Math.min(eps,M.ef), x=pad+e/maxE*(w-pad-14), y=(h-26)-this.stressAt(e)/maxS*(h-56);
  ctx.fillStyle='#fff'; ctx.shadowColor='#93dcf4'; ctx.shadowBlur=9;
  ctx.beginPath(); ctx.arc(x,y,3,0,7); ctx.fill(); ctx.shadowBlur=0; },
drawHeat(eps,M){ const cv=this.heat; const w=cv.clientWidth,h=cv.clientHeight; if(!w) return;
  if(cv.width!==w*PR){cv.width=w*PR;cv.height=h*PR;}
  const ctx=cv.getContext('2d'); ctx.setTransform(PR,0,0,PR,0,0); ctx.clearRect(0,0,w,h);
  const prog=clamp(eps/Math.max(M.ef,.0001),0,1);
  const cs=this.crackSite;
  ctx.globalCompositeOperation='lighter';
  for(let gx=0;gx<24;gx++) for(let gy=0;gy<8;gy++){
    const u=gx/23, v=gy/7;
    const d=Math.hypot(u-cs.x,(v-cs.y)*.4);
    let local=clamp(prog*(1.15-d*1.7),0,1);
    this.defectSites.forEach(ds=>{ local=Math.max(local,clamp(prog*(0.9-Math.hypot(u-ds.x,(v-ds.y)*.4)*2.2),0,1)); });
    const x=18+u*(w-52), y=30+v*(h-58);
    let cr,cg,cb;
    if(local<.33){ cr=40+local*3*80; cg=30; cb=90+local*3*140; }
    else if(local<.66){ const t2=(local-.33)*3; cr=120+t2*135; cg=30+t2*60; cb=230-t2*160; }
    else{ const t3=(local-.66)*3; cr=255; cg=90+t3*140; cb=70-t3*40; }
    ctx.fillStyle=`rgba(${cr|0},${cg|0},${cb|0},${.2+local*.7})`;
    ctx.beginPath(); ctx.arc(x,y,3+local*3,0,7); ctx.fill(); }
  ctx.globalCompositeOperation='source-over';
  const grad=ctx.createLinearGradient(w-16,h-30,w-16,30);
  grad.addColorStop(0,'#2a1e5e'); grad.addColorStop(.5,'#ff5a46'); grad.addColorStop(1,'#ffe28a');
  ctx.fillStyle=grad; ctx.fillRect(w-18,30,6,h-60);
  ctx.fillStyle='rgba(163,156,141,.8)'; ctx.font='7.5px "IBM Plex Mono"'; ctx.textAlign='right';
  ctx.fillText((prog*25).toFixed(0)+'%',w-24,36); } };
SCREEN_HOOKS.lab={enter(){ Lab.rebuildSel(); Lab.applyRanges(); Lab.renderOutcomes(); }};
