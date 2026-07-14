'use strict';
/* ════════════════════════════════════════════════════════════
   CHALLENGES — ten distinct engineering experiences.
   Each bench: real state · tests · visible response · failures ·
   scoring · replay · saved results.
   ════════════════════════════════════════════════════════════ */
const Bench={ active:null, raf:null,
open(title,sideHTML,drawFn){
  openModal(`<div class="panel-title">${title}</div><div class="panel-body">
    <div class="bench"><div class="bench-stage"><canvas id="bench-cv"></canvas><div id="bench-hud"></div></div>
    <div class="bench-side">${sideHTML}<div id="bench-out"></div><div id="bench-result"></div></div></div></div>`);
  const cv=$('#bench-cv');
  this.active={cv,draw:drawFn,t0:now()};
  if(!this.raf) this.loop();
  return {cv, out:$('#bench-out'), res:$('#bench-result'), hud:$('#bench-hud')}; },
loop(){ this.raf=requestAnimationFrame(()=>this.loop());
  if(!this.active) return;
  if(!$('#modal-root').classList.contains('open')){ this.active=null; return; }
  const cv=this.active.cv; if(!cv||!cv.isConnected){ this.active=null; return; }
  const w=cv.parentElement.clientWidth,h=cv.parentElement.clientHeight;
  if(!w) return;
  if(cv.width!==w*PR){ cv.width=w*PR; cv.height=h*PR; }
  const ctx=cv.getContext('2d'); ctx.setTransform(PR,0,0,PR,0,0); ctx.clearRect(0,0,w,h);
  try{ this.active.draw(ctx,w,h,(now()-this.active.t0)/1000); }catch(e){ console.error(e); this.active=null; } },
slider(id,label,min,max,val,step,unit){ return `<div class="slider-row"><label>${label} <b id="${id}-v">${val}${unit||''}</b></label>
  <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></div>`; },
wireSlider(id,unit,cb){ const el=$('#'+id); if(!el) return;
  el.addEventListener('input',()=>{ $('#'+id+'-v').textContent=el.value+(unit||''); cb(+el.value); }); },
chips(name,opts,sel){ return `<div class="eyebrow" style="margin:10px 0 6px">${name}</div>
  <div class="row wrap" style="gap:5px" data-chips="${name}">${opts.map(o=>
    `<button class="chip ${o===sel?'on':''}" data-c="${o}">${o}</button>`).join('')}</div>`; },
wireChips(name,cb){ $$(`[data-chips="${name}"] .chip`).forEach(b=>b.addEventListener('click',()=>{
    $$(`[data-chips="${name}"] .chip`).forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); Sound.click(); cb(b.dataset.c); })); },
finish(chId,score,notes,failures){ const done=score>=60;
  Sound[done?'discover':'fail']();
  $('#bench-result').innerHTML=`<div class="notice ${done?'':'verm'}" style="margin-top:12px">
    <b style="font-size:17px">Score ${score} / 100</b> — ${score>=80?'Exceptional trade-off.':score>=60?'A defensible engineering choice.':score>=40?'Workable, with real compromises.':'The review board declines.'}<br>
    ${failures.length?'<br><b style="letter-spacing:.14em;font-size:9px">FAILURE MODES</b><br>'+failures.map(f=>'✗ '+f).join('<br>'):''}
    ${notes.length?'<br><b style="letter-spacing:.14em;font-size:9px">ANALYSIS</b><br>'+notes.map(n=>'· '+n).join('<br>'):''}
    <br><span class="tiny dim">Revise the design and test again — scores replace on retest.</span></div>`;
  const ch=CHALLENGES.find(c=>c.id===chId);
  logEntry(`Challenge test — ${ch.n}: ${score}/100.${failures.length?' Failures: '+failures.length:''}`, done?'opal':'verm');
  if(done&&!S.questsDone[chId]){ S.questsDone[chId]=true; addXP(180,'· challenge cleared'); addCredits(150,'· challenge bounty');
    save(); renderChallenges(); }
  if(window.Quests) Quests.event('challenge',{id:chId,score}); } };

/* ═════════ 2 · FLEXIBLE WEARABLE SENSOR ═════════ */
function openWearable(){
  const st={cond:'graphene',sub:'silicone',enc:'none',pattern:'serpentine',th:200,test:null,testT:0,cracked:false,metrics:null};
  const COND={graphene:{gf:35,str:5,dur:3,cost:8,sweat:4},'silver nanowires':{gf:8,str:25,dur:3,cost:5,sweat:1},
    'liquid metal':{gf:2.5,str:100,dur:5,cost:5,sweat:4},mxene:{gf:18,str:15,dur:2,cost:4,sweat:1},
    'PEDOT:PSS':{gf:6,str:30,dur:3,cost:9,sweat:2},'carbon nanotubes':{gf:22,str:12,dur:4,cost:5,sweat:4}};
  const SUB={silicone:{flex:10,comfort:9,bio:5},hydrogel:{flex:9,comfort:10,bio:5,dry:true},PET:{flex:4,comfort:4,bio:3},PLA:{flex:2,comfort:3,bio:4}};
  const PAT={straight:{strM:.4,gfM:1.25},serpentine:{strM:1.7,gfM:.85},mesh:{strM:2.3,gfM:.6}};
  const compute=()=>{ const c=COND[st.cond],s=SUB[st.sub],p=PAT[st.pattern];
    const thF=st.th/200; // 50..500 nm→µm scale
    const stretch=Math.min(c.str*p.strM, s.flex*8);
    const gf=c.gf*p.gfM*(1.4-thF*.4);
    const dur=clamp(c.dur+(st.enc!=='none'?1.5:0)+(st.pattern==='mesh'?1:0)-(thF<.5?1:0),0,10);
    const sweatRes=st.enc!=='none'? 5 : c.sweat;
    const noise=clamp(10-gf*.15-(st.enc!=='none'?1:0)+(st.sub==='hydrogel'?1:0),1,10);
    const comfort=s.comfort-(st.th>350?2:0)-(st.enc==='PLA shell'?3:0);
    const cost=Math.round(10-c.cost+thF*2+(st.enc!=='none'?1:0));
    return {stretch,gf,dur,sweatRes,noise,comfort,cost}; };
  const out=()=>{ const m=compute(); st.metrics=m;
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Gauge factor</span><b>${m.gf.toFixed(1)}</b></div>
      <div class="kv"><span>Stretchability</span><b>${m.stretch.toFixed(0)} %</b></div>
      <div class="kv"><span>Durability</span><b>${'★'.repeat(Math.round(clamp(m.dur,0,5)))+'☆'.repeat(5-Math.round(clamp(m.dur,0,5)))}</b></div>
      <div class="kv"><span>Signal noise</span><b>${m.noise.toFixed(1)} /10</b></div>
      <div class="kv"><span>Comfort</span><b>${clamp(m.comfort,0,10).toFixed(0)} /10</b></div>
      <div class="kv"><span>Est. cost</span><b>${'$'.repeat(clamp(Math.round(m.cost/2),1,5))}</b></div>`; };
  const side=Bench.chips('Conductive material',Object.keys(COND),st.cond)
    +Bench.chips('Substrate',Object.keys(SUB),st.sub)
    +Bench.chips('Encapsulation',['none','silicone skin','parylene'],st.enc)
    +Bench.chips('Trace pattern',Object.keys(PAT),st.pattern)
    +Bench.slider('ws-th','Trace thickness',50,500,200,10,' nm')
    +`<div class="eyebrow" style="margin:12px 0 6px">Tests</div><div class="ctl-group">
      <button class="ctl sm" data-wt="bend">Bend</button><button class="ctl sm" data-wt="stretch">Stretch</button>
      <button class="ctl sm" data-wt="cycle">10k cycles</button><button class="ctl sm" data-wt="sweat">Sweat</button>
      <button class="ctl sm primary" data-wt="final">Score design</button></div>`;
  Bench.open('Wearable Sensor Bench — skin-mounted strain gauge',side,(ctx,w,h,t)=>{
    const m=st.metrics||compute();
    const bend= st.test==='bend'||st.test==='cycle'? Math.sin(t*3)*.5+.5 : st.test==='stretch'? Math.min(1,(t-st.testT)*.5) : .15+.1*Math.sin(t*.8);
    // wrist
    const cy=h*.62, R=h*.55;
    ctx.fillStyle='rgba(200,170,150,.16)'; ctx.strokeStyle='rgba(230,200,180,.35)';
    ctx.beginPath(); ctx.ellipse(w/2,cy+R*.62,R*1.15,R*(.85-bend*.12),0,Math.PI,0); ctx.fill(); ctx.stroke();
    // sensor patch
    const px=w/2, py=cy-R*(0.2-bend*.1), pw=w*.3*(1+(st.test==='stretch'?bend*.4:0)), ph=34;
    ctx.save(); ctx.translate(px,py); ctx.rotate(Math.sin(bend*1.2)*.06);
    ctx.fillStyle='rgba(232,216,224,.16)'; ctx.strokeStyle='rgba(246,242,234,.4)';
    ctx.beginPath(); ctx.roundRect?ctx.roundRect(-pw/2,-ph/2,pw,ph,10):ctx.rect(-pw/2,-ph/2,pw,ph); ctx.fill(); ctx.stroke();
    // trace
    ctx.strokeStyle=st.cracked?'rgba(255,90,54,.9)':'rgba(147,220,244,.95)'; ctx.lineWidth=2+st.th/200;
    ctx.shadowColor='#93dcf4'; ctx.shadowBlur=8; ctx.beginPath();
    const n=st.pattern==='straight'?2:st.pattern==='serpentine'?14:26;
    for(let i=0;i<=n*4;i++){ const u=i/(n*4);
      const x=-pw/2+8+u*(pw-16);
      const y= st.pattern==='straight'?0 : Math.sin(u*Math.PI*n)* (st.pattern==='mesh'? 8+4*Math.sin(u*40):10);
      i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    ctx.stroke(); ctx.shadowBlur=0; ctx.lineWidth=1;
    if(st.cracked){ ctx.strokeStyle='rgba(255,90,54,1)';
      ctx.beginPath(); ctx.moveTo(pw*.12,-ph/2); ctx.lineTo(pw*.08,ph/2); ctx.stroke(); }
    if(st.test==='sweat'){ for(let i=0;i<8;i++){ ctx.fillStyle='rgba(147,220,244,.4)';
      ctx.beginPath(); ctx.arc(-pw/2+((i*73)%100)/100*pw,((t*30+i*37)%40)-20,2.2,0,7); ctx.fill(); } }
    ctx.restore();
    // live signal
    ctx.strokeStyle='rgba(205,188,247,.8)'; ctx.beginPath();
    for(let x=0;x<w*.9;x+=3){ const u=(t*80-x)/40;
      const sig=Math.sin(u)*bend*m.gf*.8 + (Math.random()-.5)*m.noise*.6*(st.cracked?4:1);
      const y=42-clamp(sig,-30,30);
      x?ctx.lineTo(w*.05+x,y):ctx.moveTo(w*.05+x,y); }
    ctx.stroke();
    ctx.fillStyle='rgba(163,156,141,.8)'; ctx.font='9px "IBM Plex Mono"'; ctx.textAlign='left';
    ctx.fillText('ΔR/R signal'+(st.cracked?' — CONDUCTOR CRACKED':''),w*.05,20);
  });
  const rewire=()=>{ out(); };
  Bench.wireChips('Conductive material',v=>{st.cond=v;st.cracked=false;rewire();});
  Bench.wireChips('Substrate',v=>{st.sub=v;st.cracked=false;rewire();});
  Bench.wireChips('Encapsulation',v=>{st.enc=v;rewire();});
  Bench.wireChips('Trace pattern',v=>{st.pattern=v;st.cracked=false;rewire();});
  Bench.wireSlider('ws-th',' nm',v=>{st.th=v;rewire();});
  $$('[data-wt]').forEach(b=>b.addEventListener('click',()=>{ const m=compute(); st.metrics=m;
    const wt=b.dataset.wt; st.test=wt; st.testT=(now()-Bench.active.t0)/1000; Sound.click();
    if(wt==='stretch'&&m.stretch<40){ st.cracked=true; toast('Conductor cracked at '+m.stretch.toFixed(0)+'% strain','verm','alert'); }
    if(wt==='cycle'&&m.dur<3){ st.cracked=true; toast('Fatigue failure before 10k cycles','verm','alert'); }
    if(wt==='sweat'&&m.sweatRes<3){ st.cracked=true; toast('Electrolyte corrosion — encapsulate the conductor','verm','alert'); }
    if(wt==='final'){ const fails=[];
      if(m.stretch<40) fails.push('cracks below wrist strain (needs ≥40%)');
      if(m.dur<3) fails.push('fatigue life inadequate');
      if(m.sweatRes<3) fails.push('sweat destroys the electrode');
      if(SUB[st.sub].flex<4) fails.push('substrate too stiff for skin');
      if(m.noise>7) fails.push('signal drowns in noise');
      const score=clamp(Math.round(m.gf*1.2+Math.min(m.stretch,60)*.5+m.dur*6+clamp(m.comfort,0,10)*2-(fails.length*16)),0,100);
      const notes=[]; if(m.gf>25) notes.push('Excellent sensitivity — percolation-dominated conduction.');
      if(st.pattern==='serpentine') notes.push('Serpentine geometry trades gauge factor for stretch — the standard compromise.');
      if(st.cond==='liquid metal') notes.push('Liquid metal never cracks, but its gauge factor is inherently low.');
      Bench.finish('wearable',score,notes,fails); } }));
  out(); }

/* ═════════ 3 · MARINE CORROSION CHAMBER ═════════ */
function openMarine(){
  const st={alloy:'316L stainless',coat:'epoxy',cth:200,joint:'steel bolts',cp:false,maint:5,year:0,pits:[]};
  const AL={'316L stainless':{corr:4.2,cost:3,strength:5},'carbon steel':{corr:1,cost:1,strength:5},
    'Ti-6Al-4V':{corr:5,cost:9,strength:6},'Al-Li alloy':{corr:2.4,cost:4,strength:4},'Ni-Al bronze':{corr:3.6,cost:4,strength:4}};
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed%10000)/10000; };
  for(let i=0;i<26;i++) st.pits.push({x:rnd(),y:rnd(),ph:rnd()});
  const modelAt=(yr)=>{ const a=AL[st.alloy];
    const coatLife= st.coat==='none'?0 : (st.cth/100)*(st.coat==='zinc-rich primer'?2.4:st.coat==='anodised'?3:2);
    const repaints=Math.floor(yr/st.maint);
    const exposedYears=Math.max(0, yr - Math.min(yr,coatLife+repaints*coatLife*.8));
    let rate=(6-a.corr)*.9; if(st.cp) rate*=.35;
    const galv= (st.joint==='steel bolts'&&st.alloy!=='carbon steel'&&st.alloy!=='316L stainless')?1.6
      : (st.joint==='ti bolts'&&(st.alloy==='Al-Li alloy'||st.alloy==='carbon steel'))?1.8:1;
    const loss=clamp(exposedYears*rate*galv*.9,0,60);
    const strength=clamp(100-loss*1.8,0,100);
    const cost=a.cost*100 + (st.coat!=='none'?st.cth*.4:0) + repaints*(st.coat!=='none'?120:60) + (st.cp? yr*22:0) + (st.joint==='ti bolts'?150:30);
    const env=(st.cp? yr*1.4:0)+(st.coat==='zinc-rich primer'? yr*.8:0)+repaints*3+(a.corr<2? loss*.8:0);
    return {loss,strength,cost:Math.round(cost),env:Math.round(env),coatLife,galv,exposedYears}; };
  const out=()=>{ const m=modelAt(st.year);
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Exposure</span><b>${st.year<1? 'Day '+Math.max(1,Math.round(st.year*365)) : 'Year '+st.year.toFixed(0)}</b></div>
      <div class="kv"><span>Section loss</span><b style="color:${m.loss>20?'var(--verm)':'inherit'}">${m.loss.toFixed(1)} %</b></div>
      <div class="kv"><span>Remaining strength</span><b style="color:${m.strength<70?'var(--verm)':'var(--green)'}">${m.strength.toFixed(0)} %</b></div>
      <div class="kv"><span>Cumulative cost</span><b>$${fmt(m.cost)}</b></div>
      <div class="kv"><span>Environmental load</span><b>${m.env} eco-units</b></div>
      ${m.galv>1?'<p class="tiny" style="color:#ffb8a6;margin-top:6px">⚠ Galvanic couple active at the joint</p>':''}`; };
  const side=Bench.chips('Base alloy',Object.keys(AL),st.alloy)
    +Bench.chips('Coating',['none','epoxy','zinc-rich primer','anodised'],st.coat)
    +Bench.slider('mc-th','Coating thickness',0,500,200,20,' µm')
    +Bench.chips('Joining',['steel bolts','ti bolts','welded'],st.joint)
    +`<div class="row" style="justify-content:space-between;margin:10px 0"><span class="eyebrow">Cathodic protection (anode)</span>
      <button class="tog" id="mc-cp" role="switch" aria-checked="false"></button></div>`
    +Bench.slider('mc-maint','Maintenance interval',1,10,5,1,' yr')
    +Bench.slider('mc-year','⏱ Exposure time',0,25,0,1,' yr')
    +`<div class="ctl-group" style="margin-top:8px"><button class="ctl sm primary" id="mc-score">Assess at 25 years</button></div>
    <p class="tiny dim" style="margin-top:6px">Click hotspots on the bracket to diagnose them.</p>`;
  const ui=Bench.open('Seawater Exposure Chamber — hull bracket, 25-year service',side,(ctx,w,h,t)=>{
    const m=modelAt(st.year);
    // water
    const wl=h*.3;
    const wg=ctx.createLinearGradient(0,wl,0,h);
    wg.addColorStop(0,'rgba(60,140,170,.25)'); wg.addColorStop(1,'rgba(10,40,60,.5)');
    ctx.fillStyle=wg; ctx.fillRect(0,wl,w,h-wl);
    ctx.strokeStyle='rgba(147,220,244,.5)'; ctx.beginPath();
    for(let x=0;x<w;x+=6) ctx.lineTo(x,wl+Math.sin(x*.04+t*1.4)*3);
    ctx.stroke();
    // bracket
    const bx=w*.32,by=h*.36,bw=w*.36,bh=h*.42;
    const metal=ctx.createLinearGradient(bx,by,bx+bw,by);
    metal.addColorStop(0,'#5a6070'); metal.addColorStop(.4,'#a8aebc'); metal.addColorStop(1,'#4a4f5e');
    ctx.fillStyle=metal;
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+bw,by); ctx.lineTo(bx+bw,by+bh*.3);
    ctx.lineTo(bx+bw*.6,by+bh*.34); ctx.lineTo(bx+bw*.6,by+bh); ctx.lineTo(bx,by+bh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(246,242,234,.3)'; ctx.stroke();
    // coating tint
    if(st.coat!=='none'&&m.exposedYears<st.year+1){ ctx.fillStyle= st.coat==='epoxy'?'rgba(120,140,90,.18)':st.coat==='zinc-rich primer'?'rgba(160,170,180,.2)':'rgba(147,180,220,.15)';
      ctx.fill(); }
    // bolts
    [[.12,.12],[.5,.12],[.88,.18],[.3,.85],[.12,.6]].forEach(([u,v])=>{ const x=bx+u*bw,y=by+v*bh;
      ctx.fillStyle='#33363f'; ctx.beginPath(); ctx.arc(x,y,5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.stroke(); });
    // pitting / rust
    const sev=m.loss/60;
    st.pits.forEach((p,i)=>{ if(p.ph>sev*1.6) return;
      const x=bx+p.x*bw*.95, y=by+p.y*bh;
      const r=1.5+sev*7*(0.4+p.ph);
      const rust= st.alloy==='carbon steel'||st.alloy==='Al-Li alloy';
      ctx.fillStyle=rust? `rgba(150,70,30,${.4+sev*.5})` : `rgba(60,30,40,${.3+sev*.6})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); });
    // galvanic glow at bolts
    if(m.galv>1&&st.year>1){ ctx.strokeStyle=`rgba(255,90,54,${.4+.3*Math.sin(t*3)})`;
      ctx.beginPath(); ctx.arc(bx+.5*bw,by+.12*bh,10,0,7); ctx.stroke(); }
    // anode
    if(st.cp){ ctx.fillStyle='#c9ccda'; ctx.fillRect(bx-30,by+bh*.5,18,34);
      ctx.fillStyle='rgba(163,156,141,.8)'; ctx.font='8px "IBM Plex Mono"'; ctx.textAlign='center';
      ctx.fillText('Zn',bx-21,by+bh*.5+20);
      ctx.strokeStyle='rgba(147,220,244,.3)';
      for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(bx-21,by+bh*.5+17,14+i*8+(t*10)%8,-.8,.8); ctx.stroke(); } }
    ctx.fillStyle='rgba(246,242,234,.8)'; ctx.font='10px "Archivo Narrow"'; ctx.textAlign='center';
    ctx.fillText((st.alloy+' · '+(st.year<1?'DAY '+Math.max(1,Math.round(st.year*365)):'YEAR '+st.year.toFixed(0))).toUpperCase(),w/2,24);
  });
  ui.cv.addEventListener('click',e=>{ const r=ui.cv.getBoundingClientRect();
    const u=(e.clientX-r.left)/r.width,v=(e.clientY-r.top)/r.height;
    if(u>.3&&u<.7&&v>.3&&v<.5&&modelAt(st.year).galv>1)
      toast('Galvanic corrosion — the bolt is nobler than the bracket; the bracket corrodes for it','verm','alert',5200);
    else if(u>.3&&u<.7&&v>.25&&v<.42) toast('Waterline zone — alternating wet/dry drives the fiercest attack','','hex',4200);
    else if(u>.3&&u<.7) toast('Crevice sites under washers trap stagnant chloride — classic pitting initiation','','hex',4200); });
  Bench.wireChips('Base alloy',v=>{st.alloy=v;out();});
  Bench.wireChips('Coating',v=>{st.coat=v;out();});
  Bench.wireChips('Joining',v=>{st.joint=v;out();});
  Bench.wireSlider('mc-th',' µm',v=>{st.cth=v;out();});
  Bench.wireSlider('mc-maint',' yr',v=>{st.maint=v;out();});
  Bench.wireSlider('mc-year',' yr',v=>{st.year=v;out();});
  $('#mc-cp').addEventListener('click',()=>{ st.cp=!st.cp; $('#mc-cp').setAttribute('aria-checked',st.cp); out(); });
  $('#mc-score').addEventListener('click',()=>{ const m=modelAt(25); const fails=[],notes=[];
    if(m.strength<70) fails.push('remaining strength below 70% at year 25');
    if(m.galv>1) fails.push('unresolved galvanic couple at the joint');
    if(m.cost>2200) notes.push('Costly strategy — titanium-grade budgets need titanium-grade justification.');
    if(m.env>40) notes.push('High environmental load from anodes/coatings — factor the zinc you shed into the sea.');
    if(st.alloy==='316L stainless') notes.push('316L is the honest default; watch crevice sites, not free surfaces.');
    if(st.alloy==='Ti-6Al-4V') notes.push('Titanium is seawater-immune — you are paying for certainty.');
    const score=clamp(Math.round(m.strength*.6+(2600-Math.min(m.cost,2600))/2600*25+(60-Math.min(m.env,60))/60*15-fails.length*14),0,100);
    Bench.finish('marine',score,notes,fails); });
  out(); }

/* ═════════ 4 · TRANSPARENT CONDUCTIVE ELECTRODE ═════════ */
function openElectrode(){
  const st={mat:'ITO',sub:'PET',pattern:'solid film',th:100,prot:false,folds:0,folding:false,dead:false};
  const M={'ITO':{T0:92,Rs0:12,fold:180,temp:350,cost:6,sus:4,brittle:true},
    'graphene':{T0:97.3,Rs0:300,fold:100000,temp:1000,cost:8,sus:6,brittle:false},
    'silver nanowires':{T0:91,Rs0:18,fold:20000,temp:120,cost:5,sus:5,brittle:false},
    'MXene':{T0:88,Rs0:60,fold:8000,temp:100,cost:6,sus:4,brittle:false},
    'PEDOT:PSS':{T0:90,Rs0:120,fold:50000,temp:120,cost:3,sus:7,brittle:false},
    'carbon nanotubes':{T0:89,Rs0:150,fold:60000,temp:200,cost:5,sus:6,brittle:false}};
  const calc=()=>{ const m=M[st.mat]; const thF=st.th/100;
    const T=clamp(m.T0-(thF-1)*(st.mat==='graphene'?2.3:7),40,99);
    const Rs=Math.max(2,m.Rs0/thF);
    const fold=Math.round(m.fold*(st.sub==='glass'?0.001:1)*(m.brittle?1/thF:1)*(st.prot?1.5:1)*(st.pattern==='grid'?1.6:st.pattern==='nanomesh'?2.2:1));
    return {T,Rs,fold,FoM:T/Math.max(Rs,1)*10}; };
  const out=()=>{ const c=calc(); const m=M[st.mat];
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Transmittance</span><b>${c.T.toFixed(1)} %</b></div>
      <div class="kv"><span>Sheet resistance</span><b>${c.Rs.toFixed(0)} Ω/□</b></div>
      <div class="kv"><span>Fold life (pred.)</span><b>${fmt(c.fold)} folds</b></div>
      <div class="kv"><span>Process temp</span><b>${m.temp} °C ${st.sub!=='glass'&&m.temp>150?'<span style="color:var(--verm)">⚠ exceeds '+st.sub+'</span>':''}</b></div>
      <div class="kv"><span>Folds survived</span><b style="color:${st.dead?'var(--verm)':'inherit'}">${fmt(st.folds)}${st.dead?' — FAILED':''}</b></div>`; };
  const side=Bench.chips('Conductive material',Object.keys(M),st.mat)
    +Bench.chips('Substrate',['PET','polyimide','glass'],st.sub)
    +Bench.chips('Pattern',['solid film','grid','nanomesh'],st.pattern)
    +Bench.slider('el-th','Film thickness',20,400,100,10,' nm')
    +`<div class="row" style="justify-content:space-between;margin:10px 0"><span class="eyebrow">Protective overcoat</span>
      <button class="tog" id="el-prot" role="switch" aria-checked="false"></button></div>
    <div class="ctl-group"><button class="ctl sm" id="el-fold">Fold test ×1000</button>
      <button class="ctl sm primary" id="el-score">Score design</button></div>`;
  Bench.open('Foldable Display Layer — transparent electrode',side,(ctx,w,h,t)=>{
    const c=calc();
    /* T–Rs field */
    const fx=w*.06,fy=30,fw=w*.5,fh=h*.5;
    ctx.strokeStyle='rgba(246,242,234,.15)'; ctx.strokeRect(fx,fy,fw,fh);
    ctx.fillStyle='rgba(163,156,141,.75)'; ctx.font='8.5px "IBM Plex Mono"'; ctx.textAlign='center';
    ctx.fillText('sheet resistance Ω/□ (log) →',fx+fw/2,fy+fh+16);
    ctx.save(); ctx.translate(fx-10,fy+fh/2); ctx.rotate(-Math.PI/2); ctx.fillText('transmittance % →',0,0); ctx.restore();
    // iso-FoM curves
    for(let k=1;k<=3;k++){ ctx.strokeStyle=`rgba(139,108,240,${.12*k})`; ctx.beginPath();
      for(let px2=0;px2<=fw;px2+=6){ const Rs=Math.pow(10,.3+px2/fw*2.7); const T=60+k*12- (Rs<30?0:Math.log10(Rs)*3);
        const py2=fy+fh-(T-40)/60*fh; px2?ctx.lineTo(fx+px2,py2):ctx.moveTo(fx+px2,py2); }
      ctx.stroke(); }
    Object.entries(M).forEach(([name,m])=>{ const Rs=m.Rs0,T=m.T0;
      const px2=fx+(Math.log10(Rs)-.3)/2.7*fw, py2=fy+fh-(T-40)/60*fh;
      ctx.fillStyle= name===st.mat?'#93dcf4':'rgba(205,188,247,.4)';
      ctx.beginPath(); ctx.arc(px2,py2,name===st.mat?5:3,0,7); ctx.fill();
      if(name===st.mat){ ctx.strokeStyle='rgba(147,220,244,.5)'; ctx.beginPath(); ctx.arc(px2,py2,9+Math.sin(t*3)*2,0,7); ctx.stroke(); } });
    const px2=fx+(Math.log10(c.Rs)-.3)/2.7*fw, py2=fy+fh-(c.T-40)/60*fh;
    ctx.fillStyle='#fff'; ctx.shadowColor='#93dcf4'; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.arc(clamp(px2,fx,fx+fw),clamp(py2,fy,fy+fh),4,0,7); ctx.fill(); ctx.shadowBlur=0;
    /* folding display */
    const dx=w*.66,dy=h*.28,dw=w*.28,dh=h*.44;
    const fold= st.folding? Math.abs(Math.sin(t*4)) : .12;
    ctx.save(); ctx.translate(dx+dw/2,dy+dh/2);
    const half=dw/2;
    [[-1,-fold],[1,fold]].forEach(([s,f])=>{ ctx.save(); ctx.rotate(s*f*.9);
      const g=ctx.createLinearGradient(0,0,s*half,0);
      g.addColorStop(0,'rgba(40,44,80,.9)'); g.addColorStop(1,'rgba(90,100,180,.6)');
      ctx.fillStyle=g; ctx.fillRect(s>0?0:-half,-dh/2,half,dh);
      ctx.globalAlpha=c.T/100*.5;
      ctx.fillStyle='#93dcf4'; ctx.fillRect(s>0?4:-half+4,-dh/2+6,half-8,dh-12);
      ctx.globalAlpha=1; ctx.restore(); });
    if(st.dead){ ctx.strokeStyle='rgba(255,90,54,.95)'; ctx.lineWidth=1.6;
      for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(0,-dh/2+k*dh/5);
        ctx.lineTo((k%2?6:-6),-dh/2+(k+1)*dh/5); ctx.stroke(); } ctx.lineWidth=1; }
    ctx.restore();
    ctx.fillStyle='rgba(246,242,234,.75)'; ctx.font='9px "Archivo Narrow"'; ctx.textAlign='center';
    ctx.fillText(('fold test — '+fmt(st.folds)+' cycles'+(st.dead?' · CONDUCTIVITY LOST':'')).toUpperCase(),dx+dw/2,dy+dh+22);
  });
  Bench.wireChips('Conductive material',v=>{st.mat=v;st.dead=false;st.folds=0;out();});
  Bench.wireChips('Substrate',v=>{st.sub=v;st.dead=false;out();});
  Bench.wireChips('Pattern',v=>{st.pattern=v;out();});
  Bench.wireSlider('el-th',' nm',v=>{st.th=v;out();});
  $('#el-prot').addEventListener('click',()=>{ st.prot=!st.prot; $('#el-prot').setAttribute('aria-checked',st.prot); out(); });
  $('#el-fold').addEventListener('click',()=>{ st.folding=true; Sound.click();
    setTimeout(()=>{ st.folding=false; st.folds+=1000; const c=calc();
      if(st.folds>=c.fold){ st.dead=true; Sound.fail(); toast('Electrode cracked at ~'+fmt(c.fold)+' folds','verm','alert'); }
      out(); },1600); });
  $('#el-score').addEventListener('click',()=>{ const c=calc(); const m=M[st.mat]; const fails=[],notes=[];
    if(c.T<85) fails.push('transmittance below 85% display floor');
    if(c.Rs>200) fails.push('sheet resistance too high for uniform drive');
    if(c.fold<10000) fails.push('fold life below 10k requirement');
    if(st.sub!=='glass'&&m.temp>150) fails.push('process temperature destroys the '+st.sub+' substrate');
    if(st.mat==='ITO') notes.push('ITO wins on Rs but is a ceramic — folding is its death sentence. Indium supply adds cost risk.');
    if(st.mat==='graphene') notes.push('Best transparency and fold life; sheet resistance needs doping or hybrid grids.');
    if(st.pattern!=='solid film') notes.push('Patterning trades a little conductivity for dramatic flexibility.');
    const score=clamp(Math.round((c.T-80)*2.4+(220-Math.min(c.Rs,220))/220*24+Math.min(Math.log10(Math.max(c.fold,1))*9,45)+m.sus*2-(fails.length*18)),0,100);
    Bench.finish('electrode',score,notes,fails); });
  out(); }

/* ═════════ 5 · SPACECRAFT THERMAL PROTECTION ═════════ */
function openThermal(){
  const st={layers:[{k:'SiC tile',th:30},{k:'PICA ablator',th:50},{k:'silica aerogel',th:60},{k:'Ti-6Al-4V',th:20}],
    running:false,prog:0,Ts:[],ablated:0,peakBack:293,cracked:false,drag:null};
  const MATL={'SiC tile':{kth:.08,rho:3.2,tmax:1900,crack:1600},'alumina tile':{kth:.06,rho:3.9,tmax:1750,crack:1400},
    'C–C composite':{kth:.2,rho:1.8,tmax:2400,crack:2600},
    'PICA ablator':{kth:.02,rho:.27,abl:true},'cork ablator':{kth:.03,rho:.5,abl:true},'none':{kth:99,rho:0},
    'silica aerogel':{kth:.004,rho:.15,tmax:900},'LI-900 silica':{kth:.01,rho:.14,tmax:1500},'mycelium panel':{kth:.012,rho:.15,tmax:420},
    'Ti-6Al-4V':{kth:.12,rho:4.4,tmax:670},'Al-Li alloy':{kth:.5,rho:2.7,tmax:420},'CFRP':{kth:.05,rho:1.6,tmax:420}};
  const SETS2=[['SiC tile','alumina tile','C–C composite'],['PICA ablator','cork ablator','none'],
    ['silica aerogel','LI-900 silica','mycelium panel'],['Ti-6Al-4V','Al-Li alloy','CFRP']];
  const NAMES=['Outer ceramic','Ablative','Insulation','Structure'];
  const mass=()=>st.layers.reduce((a,l)=>a+MATL[l.k].rho*l.th*.42,0);
  const out=()=>{ $('#bench-out').innerHTML=`<div class="divider"></div>
    <div class="kv"><span>Total areal mass</span><b style="color:${mass()>160?'var(--verm)':'inherit'}">${mass().toFixed(0)} kg/m² ${mass()>160?'(budget 160)':''}</b></div>
    <div class="kv"><span>Ablator remaining</span><b>${Math.max(0,st.layers[1].th-st.ablated).toFixed(0)} / ${st.layers[1].th} mm</b></div>
    <div class="kv"><span>Peak cabin-side temp</span><b style="color:${st.peakBack>450?'var(--verm)':'var(--green)'}">${st.peakBack.toFixed(0)} K</b></div>
    ${st.cracked?'<p class="tiny" style="color:#ffb8a6;margin-top:6px">⚠ Outer ceramic cracked from thermal shock</p>':''}`; };
  const side=NAMES.map((n,i)=>Bench.chips(n,SETS2[i],st.layers[i].k)).join('')
    +`<p class="tiny dim" style="margin:8px 0">Drag the white boundaries in the stack to resize layers.</p>
    <div class="ctl-group"><button class="ctl sm primary" id="th-run">Run re-entry</button>
      <button class="ctl sm" id="th-reset">Reset</button><button class="ctl sm" id="th-score">Score design</button></div>`;
  const ui=Bench.open('Re-entry Heat Shield — layered protection stack',side,(ctx,w,h,t)=>{
    if(st.running){ st.prog=Math.min(1,st.prog+.004);
      // 1D explicit conduction across 40 cells
      const N=40, tot=st.layers.reduce((a,l)=>a+l.th,0);
      if(!st.Ts.length) st.Ts=Array(N).fill(293);
      const flux= Math.sin(st.prog*Math.PI)**1.5 * 1.0;   // heat pulse
      const abl=MATL[st.layers[1].k].abl && st.ablated<st.layers[1].th;
      const surfT=800+flux*(abl? 1400 : 2100);
      if(abl) st.ablated=Math.min(st.layers[1].th, st.ablated+flux*.35);
      st.Ts[0]=surfT;
      const kAt=(i)=>{ let x=i/N*tot, acc=0;
        for(const l of st.layers){ acc+=l.th; if(x<=acc) return MATL[l.k].kth; }
        return .1; };
      for(let it=0;it<3;it++) for(let i=1;i<N-1;i++)
        st.Ts[i]+= kAt(i)*40*(st.Ts[i-1]+st.Ts[i+1]-2*st.Ts[i])*.02;
      st.Ts[N-1]+=kAt(N-1)*40*(st.Ts[N-2]-st.Ts[N-1])*.02;
      st.peakBack=Math.max(st.peakBack,st.Ts[N-1]);
      const oc=MATL[st.layers[0].k];
      if(surfT>oc.crack&&!st.cracked&&Math.random()<.02){ st.cracked=true; Sound.fail(); toast('Thermal shock — outer ceramic cracked','verm','alert'); }
      if(st.prog>=1){ st.running=false; out(); }
    }
    // plasma
    if(st.running){ const fl=Math.sin(st.prog*Math.PI);
      const pg=ctx.createLinearGradient(0,0,w*.3,0);
      pg.addColorStop(0,`rgba(255,140,60,${fl*.5})`); pg.addColorStop(.6,`rgba(255,80,120,${fl*.2})`); pg.addColorStop(1,'transparent');
      ctx.fillStyle=pg; ctx.fillRect(0,0,w*.36,h);
      for(let i=0;i<14;i++){ ctx.strokeStyle=`rgba(255,${160+Math.random()*60|0},80,${fl*.5})`;
        const y=Math.random()*h; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w*.2*Math.random(),y+10); ctx.stroke(); } }
    // stack
    const sx=w*.4,sw=w*.44,sy=h*.14,sh=h*.66;
    const tot=st.layers.reduce((a,l)=>a+l.th,0);
    let acc=0; st.bounds=[];
    st.layers.forEach((l,i)=>{ const lw=l.th/tot*sw;
      const x0=sx+acc/tot*sw;
      const cols={'SiC tile':'#3a3f4a','alumina tile':'#c8c2b0','C–C composite':'#23252d',
        'PICA ablator':'#8a5a3a','cork ablator':'#a8794a','none':'#111',
        'silica aerogel':'#bcd8f0','LI-900 silica':'#e4ded2','mycelium panel':'#d0c0a0',
        'Ti-6Al-4V':'#8a94a8','Al-Li alloy':'#b8c0cc','CFRP':'#2a2d38'};
      ctx.fillStyle=cols[l.k]||'#555';
      const ablGone= i===1? st.ablated/Math.max(l.th,1)*lw : 0;
      ctx.fillRect(x0+ablGone,sy,lw-ablGone,sh);
      // thermal front tint
      if(st.Ts.length){ const N=40;
        for(let c2=0;c2<10;c2++){ const gi=Math.floor(((acc+c2/10*l.th)/tot)*(N-1));
          const T=st.Ts[gi]||293; const heat=clamp((T-293)/1500,0,1);
          if(heat>.02){ ctx.fillStyle=`rgba(255,${120-heat*60|0},40,${heat*.55})`;
            ctx.fillRect(x0+c2/10*lw,sy,lw/10+.5,sh); } } }
      ctx.strokeStyle='rgba(246,242,234,.25)'; ctx.strokeRect(x0,sy,lw,sh);
      ctx.save(); ctx.translate(x0+lw/2,sy+sh+14); ctx.rotate(0);
      ctx.fillStyle='rgba(235,229,215,.75)'; ctx.font='8px "Archivo Narrow"'; ctx.textAlign='center';
      ctx.fillText(l.k.toUpperCase(),0,0); ctx.fillText(l.th.toFixed(0)+' mm',0,11); ctx.restore();
      acc+=l.th;
      if(i<3){ const bx2=sx+acc/tot*sw; st.bounds.push(bx2);
        ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.moveTo(bx2,sy-8); ctx.lineTo(bx2,sy+sh+8); ctx.stroke(); ctx.lineWidth=1; } });
    if(st.cracked){ ctx.strokeStyle='rgba(255,90,54,.9)';
      ctx.beginPath(); ctx.moveTo(sx+8,sy+6); ctx.lineTo(sx+20,sy+sh*.4); ctx.lineTo(sx+6,sy+sh*.8); ctx.stroke(); }
    ctx.fillStyle='rgba(246,242,234,.85)'; ctx.font='10px "Archivo Narrow"'; ctx.textAlign='center';
    ctx.fillText(('RE-ENTRY '+(st.running? (st.prog*100).toFixed(0)+'%' : st.prog>0?'COMPLETE':'READY')+' · CABIN SIDE '+(st.Ts[39]||293).toFixed(0)+' K').toUpperCase(),w/2,24);
    ctx.fillText('HOT SIDE →',sx-46,sy+sh/2);
  });
  ui.cv.addEventListener('pointerdown',e=>{ const r=ui.cv.getBoundingClientRect(); const x=e.clientX-r.left;
    if(!st.bounds) return;
    st.bounds.forEach((bx2,i)=>{ if(Math.abs(x-bx2)<9) st.drag=i; }); });
  ui.cv.addEventListener('pointermove',e=>{ if(st.drag==null) return;
    const r=ui.cv.getBoundingClientRect(); const x=e.clientX-r.left;
    const sx=r.width*.4,sw=r.width*.44; const tot=st.layers.reduce((a,l)=>a+l.th,0);
    let acc=0; for(let k=0;k<st.drag;k++) acc+=st.layers[k].th;
    const newTh=clamp((x-sx)/sw*tot-acc,6,120);
    const delta=newTh-st.layers[st.drag].th;
    if(st.layers[st.drag+1].th-delta>6){ st.layers[st.drag].th=newTh; st.layers[st.drag+1].th-=delta; out(); } });
  ui.cv.addEventListener('pointerup',()=>st.drag=null);
  SETS2.forEach((s2,i)=>Bench.wireChips(NAMES[i],v=>{ st.layers[i].k=v; out(); }));
  $('#th-run').addEventListener('click',()=>{ st.running=true; st.prog=0; st.Ts=[]; st.ablated=0;
    st.peakBack=293; st.cracked=false; Sound.alert(); });
  $('#th-reset').addEventListener('click',()=>{ st.running=false; st.prog=0; st.Ts=[]; st.ablated=0; st.peakBack=293; st.cracked=false; out(); });
  $('#th-score').addEventListener('click',()=>{ const fails=[],notes=[];
    if(st.prog<1){ toast('Run the re-entry first','verm','alert'); return; }
    if(st.peakBack>450) fails.push('cabin side exceeded 450 K');
    if(st.cracked) fails.push('outer ceramic thermally shocked');
    if(st.ablated>=st.layers[1].th&&MATL[st.layers[1].k].abl) fails.push('ablator fully consumed before peak heating ended');
    if(mass()>160) fails.push('exceeds 160 kg/m² mass budget');
    if(MATL[st.layers[2].k].tmax<500) notes.push('Organic insulation chars behind a hot wall — inspect its adjacent temperature.');
    if(st.layers[1].k==='none') notes.push('Reusable tile philosophy (Shuttle-style) — viable only with generous insulation.');
    else notes.push('Ablative philosophy (capsule-style) — mass burned is mass you did not insulate.');
    const score=clamp(Math.round((st.peakBack<=450?55:20)+(160-Math.min(mass(),160))/160*25+(st.cracked?0:12)+(fails.length?0:8)),0,100);
    Bench.finish('thermal',score,notes,fails); });
  out(); }

/* ═════════ 6 · BIODEGRADABLE FOOD PACKAGE ═════════ */
function openPackage(){
  const st={poly:'PLA',fibre:'cellulose nanofibre',coat:'wax',plast:15,th:400,seal:'heat',stage:0,anim:0};
  const P={PLA:{o2:6,h2o:5,str:6,comp:70,co2:.6},'PHA':{o2:7,h2o:7,str:5,comp:45,co2:.8},
    'mycelium tray':{o2:3,h2o:2,str:3,comp:30,co2:.1},'PET (fossil)':{o2:8,h2o:8,str:8,comp:100000,co2:2.3}};
  const stages=['Packed','Transport 500 km','Humidity 85%','Storage','Use','End of life'];
  const calc=()=>{ const p=P[st.poly];
    const o2=clamp(p.o2+(st.coat==='AlOx nano'?3:st.coat==='wax'?1:0)+(st.fibre!=='none'?1:0)+(st.th-300)/300,0,10);
    const h2o=clamp(p.h2o+(st.coat==='wax'?2.4:st.coat==='AlOx nano'?2:0)-(st.plast>25?1:0),0,10);
    const str=clamp(p.str+(st.fibre!=='none'?2.4:0)+(st.th-300)/250-(st.plast>25?1.5:0),0,10);
    const compost= st.poly==='PET (fossil)'? Infinity : p.comp*(st.coat==='AlOx nano'?1.6:1)*(st.fibre!=='none'?.9:1);
    const freshness=Math.round(3+o2*.9+h2o*.7);
    const co2=(p.co2+(st.coat==='AlOx nano'?.3:0)+st.th/1000*.4).toFixed(2);
    return {o2,h2o,str,compost,freshness,co2}; };
  const out=()=>{ const c=calc();
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Oxygen barrier</span><b>${c.o2.toFixed(1)} /10</b></div>
      <div class="kv"><span>Moisture barrier</span><b>${c.h2o.toFixed(1)} /10</b></div>
      <div class="kv"><span>Strength</span><b>${c.str.toFixed(1)} /10</b></div>
      <div class="kv"><span>Freshness window</span><b>${c.freshness} days</b></div>
      <div class="kv"><span>Compost time</span><b>${isFinite(c.compost)?Math.round(c.compost)+' days (industrial)':'never — fossil'}</b></div>
      <div class="kv"><span>Carbon impact</span><b>${c.co2} kgCO₂e/kg</b></div>`; };
  const side=Bench.chips('Base material',Object.keys(P),st.poly)
    +Bench.chips('Fibre reinforcement',['none','cellulose nanofibre'],st.fibre)
    +Bench.chips('Barrier coating',['none','wax','AlOx nano'],st.coat)
    +Bench.slider('pk-pl','Plasticiser',0,40,15,1,' %')
    +Bench.slider('pk-th','Wall thickness',150,900,400,25,' µm')
    +Bench.chips('Sealing',['heat','adhesive'],st.seal)
    +`<div class="ctl-group" style="margin-top:8px"><button class="ctl sm primary" id="pk-run">Run life cycle</button>
      <button class="ctl sm" id="pk-score">Score design</button></div>`;
  Bench.open('Packaging Formulation Studio — berries, 500 km, then gone',side,(ctx,w,h,t)=>{
    const c=calc();
    // lifecycle timeline
    const tx=w*.06,tw=w*.88,ty=h*.14;
    ctx.strokeStyle='rgba(246,242,234,.16)'; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx+tw,ty); ctx.stroke();
    stages.forEach((s2,i)=>{ const x=tx+i/(stages.length-1)*tw;
      const on=i<=st.stage;
      ctx.fillStyle=on?'#93dcf4':'rgba(246,242,234,.18)';
      ctx.beginPath(); ctx.arc(x,ty,on?5:3.5,0,7); ctx.fill();
      ctx.fillStyle=on?'rgba(246,242,234,.9)':'rgba(163,156,141,.5)';
      ctx.font='8px "Archivo Narrow"'; ctx.textAlign='center'; ctx.fillText(s2.toUpperCase(),x,ty+18); });
    // package visual
    const px=w/2,py=h*.56;
    const deg= st.stage>=5? clamp(st.anim,0,1) : 0;
    ctx.save(); ctx.translate(px,py);
    if(st.stage===1) ctx.translate(Math.sin(t*9)*3,Math.cos(t*11)*2); // transport shake
    const cols={PLA:'#a8d8a0','PHA':'#98c8a8','mycelium tray':'#d8c8a8','PET (fossil)':'#a8c8d8'};
    ctx.globalAlpha=1-deg*.85;
    ctx.fillStyle=cols[st.poly]; ctx.strokeStyle='rgba(246,242,234,.4)';
    const pw2=120*(1-deg*.3),ph2=70*(1-deg*.4);
    ctx.beginPath(); ctx.roundRect?ctx.roundRect(-pw2/2,-ph2/2,pw2,ph2,10):ctx.rect(-pw2/2,-ph2/2,pw2,ph2);
    ctx.globalAlpha=(.3+c.str*.04)*(1-deg*.8); ctx.fill(); ctx.globalAlpha=1-deg*.85; ctx.stroke();
    // berries
    for(let i=0;i<6;i++){ ctx.fillStyle=`rgba(120,40,90,${(st.stage<4?.9:.5)-deg*.5})`;
      ctx.beginPath(); ctx.arc(-40+i*16,6,7,0,7); ctx.fill(); }
    if(st.stage===2){ for(let i=0;i<9;i++){ ctx.fillStyle='rgba(147,220,244,.5)';
      ctx.beginPath(); ctx.arc(-55+((i*31)%110),(t*20+i*17)%60-45,1.8,0,7); ctx.fill(); } }
    if(deg>0){ for(let i=0;i<12;i++){ ctx.fillStyle=`rgba(150,120,80,${deg*.7})`;
      ctx.beginPath(); ctx.arc((Math.sin(i*2.4)*pw2*.6),(ph2*.4+i%3*8+deg*24),2.4,0,7); ctx.fill(); } }
    ctx.globalAlpha=1; ctx.restore();
    if(st.stage>=5&&st.anim<1) st.anim+=.004;
    // conflict callout
    ctx.fillStyle='rgba(163,156,141,.85)'; ctx.font='9.5px "Archivo Narrow"'; ctx.textAlign='center';
    const msg= st.stage===0? 'A package is a promise: keep oxygen out, hold the mass in.' :
      st.stage===1? (c.str<5? 'Transport shocks — thin walls are puncturing.' : 'Riding well — the fibre skeleton carries the knocks.') :
      st.stage===2? (c.h2o<5? 'Humidity is softening the wall.' : 'Barrier holding at 85% RH.') :
      st.stage===3? 'Freshness clock: '+c.freshness+' days.' :
      st.stage===4? 'Opened. Now the second life begins.' :
      isFinite(c.compost)? 'Composting: ~'+Math.round(c.compost)+' days to soil (industrial facility).' : 'This one will outlive its designer.';
    ctx.fillText(msg,w/2,h*.9);
  });
  Object.keys({a:1}).forEach(()=>{});
  Bench.wireChips('Base material',v=>{st.poly=v;out();});
  Bench.wireChips('Fibre reinforcement',v=>{st.fibre=v;out();});
  Bench.wireChips('Barrier coating',v=>{st.coat=v;out();});
  Bench.wireChips('Sealing',v=>{st.seal=v;out();});
  Bench.wireSlider('pk-pl',' %',v=>{st.plast=v;out();});
  Bench.wireSlider('pk-th',' µm',v=>{st.th=v;out();});
  $('#pk-run').addEventListener('click',()=>{ st.stage=0; st.anim=0; Sound.click();
    const step=()=>{ if(st.stage<5){ st.stage++; Sound.scan(st.stage/5); setTimeout(step,1400); } else out(); };
    setTimeout(step,900); });
  $('#pk-score').addEventListener('click',()=>{ const c=calc(); const fails=[],notes=[];
    if(c.str<4.5) fails.push('punctures in transport');
    if(c.o2<5) fails.push('berries oxidise before sale');
    if(!isFinite(c.compost)) fails.push('fails the biodegradability brief entirely');
    else if(c.compost>120) fails.push('composts too slowly for certification (>120 d)');
    if(c.h2o<4) fails.push('humidity collapse in the cold chain');
    notes.push('The core conflict: every barrier you add slows the same molecules that composting needs to reach the polymer.');
    if(st.poly==='mycelium tray') notes.push('Grown packaging — weakest barrier, best end-of-life. Pair with a thin coating.');
    if(st.coat==='AlOx nano') notes.push('Nanoscale oxide barriers keep compostability — thickness is the trick.');
    const score=clamp(Math.round(c.o2*3+c.h2o*2.5+c.str*3+(isFinite(c.compost)? (120-Math.min(c.compost,120))/120*25 : 0)+(2.5-Math.min(+c.co2,2.5))*8-fails.length*15),0,100);
    Bench.finish('package',score,notes,fails); });
  out(); }

/* ═════════ 7 · HIP IMPLANT STEM ═════════ */
function openImplant(){
  const st={mat:'Ti-6Al-4V',coat:'porous titanium',por:30,width:14,fix:'press-fit',cycles:0,testing:false};
  const M={'Ti-6Al-4V':{E:114,fat:5,bio:5,ion:2,wear:4},'316L steel':{E:193,fat:4,bio:3.4,ion:3.4,wear:3.6},
    'PEEK':{E:3.9,fat:3.4,bio:4.4,ion:0,wear:3},'zirconia':{E:210,fat:3,bio:4.6,ion:.4,wear:5},'alumina':{E:380,fat:2.6,bio:4.6,ion:.2,wear:5}};
  const calc=()=>{ const m=M[st.mat];
    const Eeff=m.E*(1-st.por/100*.55)*(st.width/14);
    const boneE=17;
    const shield=clamp((Eeff-boneE)/(Eeff+boneE),0,1)*100*(st.fix==='cemented'?.85:1);
    const ingrowth= st.coat==='hydroxyapatite'? 9 : st.coat==='porous titanium'? 7.5+st.por/25 : 3+(st.por>40?2:0);
    const strength= (st.mat==='PEEK'? 100 : st.mat==='zirconia'||st.mat==='alumina'? 700 : 900)*(st.width/14)**2*(1-st.por/100*.8);
    const sf=strength/ (st.mat==='PEEK'? 60 : 300);
    const fatigue=clamp(m.fat*(1-st.por/160)*(st.width/14),0,6);
    return {Eeff,shield,ingrowth,sf,fatigue,ion:m.ion,wear:m.wear,bio:m.bio}; };
  const out=()=>{ const c=calc();
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Effective stiffness</span><b>${c.Eeff.toFixed(0)} GPa <small class="dim">(bone ≈ 17)</small></b></div>
      <div class="kv"><span>Stress shielding</span><b style="color:${c.shield>75?'var(--verm)':c.shield>55?'var(--gold)':'var(--green)'}">${c.shield.toFixed(0)} %</b></div>
      <div class="kv"><span>Safety factor</span><b style="color:${c.sf<1.5?'var(--verm)':'inherit'}">${c.sf.toFixed(1)}×</b></div>
      <div class="kv"><span>Bone ingrowth</span><b>${c.ingrowth.toFixed(1)} /10</b></div>
      <div class="kv"><span>Fatigue rating</span><b>${'★'.repeat(Math.round(clamp(c.fatigue,0,5)))+'☆'.repeat(5-Math.round(clamp(c.fatigue,0,5)))}</b></div>
      <div class="kv"><span>Ion release</span><b>${c.ion.toFixed(1)} /10</b></div>
      <p class="tiny dim" style="margin-top:6px">Educational model — simplified, not clinical guidance.</p>`; };
  const side=Bench.chips('Stem material',Object.keys(M),st.mat)
    +Bench.chips('Surface coating',['none','porous titanium','hydroxyapatite'],st.coat)
    +Bench.slider('im-por','Porosity',0,60,30,5,' %')
    +Bench.slider('im-w','Stem width',9,20,14,1,' mm')
    +Bench.chips('Fixation',['press-fit','cemented'],st.fix)
    +`<div class="ctl-group" style="margin-top:8px"><button class="ctl sm" id="im-walk">Walking load</button>
      <button class="ctl sm" id="im-fat">10⁷ cycles</button><button class="ctl sm primary" id="im-score">Score design</button></div>`;
  Bench.open('Hip Implant Stem — load sharing with living bone',side,(ctx,w,h,t)=>{
    const c=calc();
    const cx=w/2, top=h*.1, bot=h*.92;
    const gait= st.testing? Math.abs(Math.sin(t*3)) : .3;
    // femur silhouette
    ctx.fillStyle='rgba(235,225,205,.13)'; ctx.strokeStyle='rgba(235,225,205,.4)';
    ctx.beginPath();
    ctx.moveTo(cx-56,top+40); ctx.quadraticCurveTo(cx-90,top+8,cx-40,top+4);   // greater trochanter→head
    ctx.quadraticCurveTo(cx+10,top+2,cx+34,top+26);
    ctx.quadraticCurveTo(cx+42,top+70,cx+30,bot*.5);
    ctx.lineTo(cx+26,bot); ctx.lineTo(cx-26,bot); ctx.lineTo(cx-30,bot*.5);
    ctx.quadraticCurveTo(cx-46,top+90,cx-56,top+40); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // load-share tint in bone: green = loaded (healthy), violet-grey = shielded
    const sh=c.shield/100;
    for(let i=0;i<10;i++){ const y=top+70+i*(bot-top-90)/10;
      const local= i<6? sh : sh*.5;   // proximal shielding worst
      ctx.fillStyle=`rgba(${local>.6?120:80},${local>.6?100:200},${local>.6?160:120},${.12+gait*.06})`;
      ctx.fillRect(cx-26,y,52,(bot-top-90)/10-2); }
    // implant
    const iw=st.width*1.4;
    const ig=ctx.createLinearGradient(cx-iw/2,0,cx+iw/2,0);
    ig.addColorStop(0,'#8a90a4'); ig.addColorStop(.5,'#e6e9f2'); ig.addColorStop(1,'#5c6274');
    ctx.fillStyle=ig;
    ctx.beginPath();
    ctx.moveTo(cx-44,top+16); ctx.quadraticCurveTo(cx-10,top+10,cx+6,top+34); // neck
    ctx.lineTo(cx+iw/2,top+90); ctx.lineTo(cx+iw/3,bot*.62); ctx.lineTo(cx-iw/3,bot*.62);
    ctx.lineTo(cx-iw/2,top+90); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.stroke();
    // femoral head ball
    ctx.beginPath(); ctx.arc(cx-52,top+14,17,0,7);
    const hg=ctx.createRadialGradient(cx-58,top+8,2,cx-52,top+14,17);
    hg.addColorStop(0,'#fff'); hg.addColorStop(.5,'#c9ccda'); hg.addColorStop(1,'#4a4f60');
    ctx.fillStyle=hg; ctx.fill();
    // coating stipple
    if(st.coat!=='none'){ ctx.fillStyle= st.coat==='hydroxyapatite'? 'rgba(230,220,180,.7)':'rgba(160,170,200,.7)';
      for(let i=0;i<40;i++){ const u=i/40;
        ctx.beginPath(); ctx.arc(cx-iw/2+((i*37)%10)/10*iw,top+95+u*(bot*.62-top-100),1.2,0,7); ctx.fill(); } }
    // load arrow on head
    const F=2.4+gait*1.8;
    ctx.strokeStyle='#8b6cf0'; ctx.fillStyle='#8b6cf0'; ctx.lineWidth=2+gait*2;
    ctx.beginPath(); ctx.moveTo(cx-52-30*F/3,top-26); ctx.lineTo(cx-52,top+2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-56,top-4); ctx.lineTo(cx-52,top+6); ctx.lineTo(cx-46,top-6); ctx.closePath(); ctx.fill();
    ctx.lineWidth=1;
    ctx.fillStyle='rgba(163,156,141,.85)'; ctx.font='9px "IBM Plex Mono"'; ctx.textAlign='left';
    ctx.fillText((F).toFixed(1)+' kN',cx-46-30*F/3,top-18);
    // legend
    ctx.font='8.5px "Archivo Narrow"';
    ctx.fillStyle='rgba(140,220,150,.9)'; ctx.fillText('■ bone loaded (healthy)',w*.05,h*.94);
    ctx.fillStyle='rgba(150,120,190,.9)'; ctx.fillText('■ bone shielded (resorbs over years)',w*.05,h*.97);
    ctx.fillStyle='rgba(246,242,234,.85)'; ctx.font='10px "Archivo Narrow"'; ctx.textAlign='center';
    ctx.fillText(('IMPLANT LOAD TRANSFER · '+st.mat+(st.testing?' · GAIT CYCLING':'')).toUpperCase(),w/2,22);
  });
  Bench.wireChips('Stem material',v=>{st.mat=v;out();});
  Bench.wireChips('Surface coating',v=>{st.coat=v;out();});
  Bench.wireChips('Fixation',v=>{st.fix=v;out();});
  Bench.wireSlider('im-por',' %',v=>{st.por=v;out();});
  Bench.wireSlider('im-w',' mm',v=>{st.width=v;out();});
  $('#im-walk').addEventListener('click',()=>{ st.testing=true; Sound.click(); setTimeout(()=>{st.testing=false;},4000); });
  $('#im-fat').addEventListener('click',()=>{ const c=calc(); Sound.click();
    if(c.fatigue<3||c.sf<1.5){ Sound.fail(); toast('Fatigue fracture before 10⁷ cycles','verm','alert'); }
    else toast('Survived 10⁷ cycles — roughly ten years of walking'); });
  $('#im-score').addEventListener('click',()=>{ const c=calc(); const fails=[],notes=[];
    if(c.sf<1.5) fails.push('insufficient strength for stair-climbing loads');
    if(c.fatigue<3) fails.push('fatigue life inadequate');
    if(c.shield>75) fails.push('severe stress shielding — proximal bone will resorb');
    if(c.ingrowth<5&&st.fix==='press-fit') fails.push('press-fit without ingrowth surface — loosening likely');
    if(c.bio<4) fails.push('nickel sensitisation risk flagged');
    if(st.mat==='PEEK') notes.push('PEEK matches bone stiffness beautifully — its limit is raw strength, so geometry must carry more.');
    if(st.mat==='Ti-6Al-4V') notes.push('The clinical standard: forgiving, proven, but 6× stiffer than bone — porosity is how you soften it.');
    if(st.mat==='alumina'||st.mat==='zirconia') notes.push('Ceramics excel at wear, but a brittle stem is an unforgiving stem.');
    const score=clamp(Math.round((c.sf>=1.5?24:6)+c.fatigue*5+(100-c.shield)*.32+c.ingrowth*2.6+(5-c.ion)*2-fails.length*13),0,100);
    Bench.finish('implant',score,notes,fails); });
  out(); }

/* ═════════ 8 · BATTERY ELECTRODE ═════════ */
function openBattery(){
  const st={act:'graphite',size:8,por:35,th:80,add:5,bind:5,cycle:1,charging:false,parts:[]};
  const A={'graphite':{cap:372,swell:10,rate:4,stab:5,cost:5},'silicon':{cap:3600,swell:300,rate:2.4,stab:2,cost:6},
    'LFP':{cap:170,swell:3,rate:4.4,stab:5,cost:4},'NMC 811':{cap:200,swell:6,rate:4,stab:3.4,cost:7}};
  const relayout=()=>{ st.parts=[]; let seed=5; const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed%10000)/10000; };
    const n=Math.round(140-st.size*8);
    for(let i=0;i<n;i++) st.parts.push({x:rnd(),y:rnd(),r:(st.size/2+rnd()*st.size/2)/100,crack:rnd()}); };
  relayout();
  const calc=()=>{ const a=A[st.act];
    const swellF=a.swell/100;
    const fade= Math.pow(Math.max(0,1-(swellF*.13+(st.bind<4?.06:0)+(st.add<3?.04:0))),Math.log10(st.cycle)+1);
    const cap0=a.cap*(1-st.por/100)*(st.th/80);
    const cap=cap0*clamp(fade,0,1);
    const rate=clamp(a.rate+(st.por-35)/22+(st.add-5)*.22-(st.th-80)/60,0,6);
    const heat=clamp(6-rate+swellF*2,0,10);
    const eDen=Math.round(cap*.36*(1-st.add/100-st.bind/100));
    const life=Math.round(4000*Math.pow(clamp(fade,0.01,1),3)/(swellF+.5));
    return {cap,cap0,rate,heat,eDen,life,swellF,fade}; };
  const out=()=>{ const c=calc();
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Capacity @ cycle ${fmt(st.cycle)}</span><b>${c.cap.toFixed(0)} mAh/g <small class="dim">(${(c.fade*100).toFixed(0)}%)</small></b></div>
      <div class="kv"><span>Energy density</span><b>${c.eDen} Wh/kg</b></div>
      <div class="kv"><span>Rate capability</span><b>${c.rate.toFixed(1)} C</b></div>
      <div class="kv"><span>Heat generation</span><b style="color:${c.heat>6?'var(--verm)':'inherit'}">${c.heat.toFixed(1)} /10</b></div>
      <div class="kv"><span>Cycle life (80%)</span><b>${fmt(c.life)}</b></div>`; };
  const side=Bench.chips('Active material',Object.keys(A),st.act)
    +Bench.slider('bt-size','Particle size',2,20,8,1,' µm')
    +Bench.slider('bt-por','Porosity',15,60,35,1,' %')
    +Bench.slider('bt-th','Electrode thickness',30,200,80,5,' µm')
    +Bench.slider('bt-add','Conductive additive',0,15,5,1,' %')
    +Bench.slider('bt-bind','Binder',2,12,5,1,' %')
    +`<div class="eyebrow" style="margin:10px 0 6px">Cycle</div>
    <div class="row wrap" style="gap:5px" data-chips="Cycle">${[1,100,500,1000].map(c=>
      `<button class="chip ${c===1?'on':''}" data-c="${c}">${c}</button>`).join('')}</div>
    <div class="ctl-group" style="margin-top:10px"><button class="ctl sm" id="bt-charge">Charge / discharge</button>
      <button class="ctl sm primary" id="bt-score">Score design</button></div>`;
  Bench.open('Electrode Microstructure Lab — where ions meet electrons',side,(ctx,w,h,t)=>{
    const c=calc();
    const ex=w*.08,ey=h*.12,ew=w*.84,eh=h*.68;
    // current collector
    ctx.fillStyle='#8a6a3a'; ctx.fillRect(ex,ey+eh,ew,8);
    ctx.fillStyle='rgba(163,156,141,.7)'; ctx.font='8px "IBM Plex Mono"'; ctx.textAlign='left';
    ctx.fillText('Cu collector',ex,ey+eh+20);
    ctx.fillText('separator / electrolyte ↑',ex,ey-8);
    // particles
    const swell=1+c.swellF*.24*(st.charging? Math.abs(Math.sin(t*2)) : (Math.log10(st.cycle)/3)*.7);
    st.parts.forEach(p=>{ const x=ex+p.x*ew, y=ey+p.y*eh;
      const r=p.r*Math.min(ew,eh)*2.2*swell*(1-st.por/160);
      const cols={'graphite':'#3c3f4a','silicon':'#8a94b8','LFP':'#5a7a5c','NMC 811':'#6a5a80'};
      ctx.fillStyle=cols[st.act];
      ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
      // SEI ring thickens with cycles
      const sei=Math.log10(st.cycle)/3;
      if(sei>0){ ctx.strokeStyle=`rgba(180,170,140,${.25+sei*.4})`; ctx.lineWidth=1+sei*2.4;
        ctx.beginPath(); ctx.arc(x,y,r+1+sei*2,0,7); ctx.stroke(); ctx.lineWidth=1; }
      // cracks on swelling chemistries
      if(c.swellF>.5&&st.cycle>=100&&p.crack<.5){ ctx.strokeStyle='rgba(255,90,54,.8)';
        ctx.beginPath(); ctx.moveTo(x-r*.7,y-r*.3); ctx.lineTo(x+r*.5,y+r*.6); ctx.stroke(); } });
    // additive network
    if(st.add>0){ ctx.strokeStyle=`rgba(147,220,244,${.1+st.add*.03})`;
      for(let i=0;i<st.parts.length-1;i+=2){ const p=st.parts[i],q=st.parts[i+1];
        ctx.beginPath(); ctx.moveTo(ex+p.x*ew,ey+p.y*eh); ctx.lineTo(ex+q.x*ew,ey+q.y*eh); ctx.stroke(); } }
    // ion + electron flow during charge
    if(st.charging){ for(let i=0;i<26;i++){ const u=((t*.16*c.rate+i*.11)%1);
        const px2=ex+((i*67)%100)/100*ew, py2=ey+u*eh;
        ctx.fillStyle='rgba(147,220,244,.9)'; ctx.beginPath(); ctx.arc(px2,py2,2,0,7); ctx.fill(); }
      for(let i=0;i<12;i++){ const u=((t*.4+i*.19)%1);
        ctx.fillStyle='rgba(255,220,140,.8)';
        ctx.beginPath(); ctx.arc(ex+u*ew,ey+eh-4,1.6,0,7); ctx.fill(); }
      if(c.heat>6){ const hg=ctx.createRadialGradient(w/2,ey+eh/2,10,w/2,ey+eh/2,ew*.4);
        hg.addColorStop(0,`rgba(255,80,40,${(c.heat-6)*.06})`); hg.addColorStop(1,'transparent');
        ctx.fillStyle=hg; ctx.fillRect(ex,ey,ew,eh); } }
    ctx.fillStyle='rgba(246,242,234,.85)'; ctx.font='10px "Archivo Narrow"'; ctx.textAlign='center';
    ctx.fillText((st.act+' electrode · cycle '+fmt(st.cycle)+(st.charging?' · CYCLING':'')).toUpperCase(),w/2,h*.94);
  });
  Bench.wireChips('Active material',v=>{st.act=v;out();});
  Bench.wireChips('Cycle',v=>{st.cycle=+v;out();});
  Bench.wireSlider('bt-size',' µm',v=>{st.size=v;relayout();out();});
  Bench.wireSlider('bt-por',' %',v=>{st.por=v;out();});
  Bench.wireSlider('bt-th',' µm',v=>{st.th=v;out();});
  Bench.wireSlider('bt-add',' %',v=>{st.add=v;out();});
  Bench.wireSlider('bt-bind',' %',v=>{st.bind=v;out();});
  $('#bt-charge').addEventListener('click',()=>{ st.charging=!st.charging; Sound.click(); });
  $('#bt-score').addEventListener('click',()=>{ const c=calc(); const fails=[],notes=[];
    if(st.add<2) fails.push('electron percolation network incomplete');
    if(st.por<20) fails.push('ion transport bottleneck — pores too tight');
    if(c.heat>7) fails.push('thermal risk under fast charge');
    if(c.swellF>1&&st.bind<6) fails.push('swelling tears the electrode apart');
    if(c.life<500) fails.push('capacity fades below 80% before 500 cycles');
    if(st.act==='silicon') notes.push('Silicon holds 10× the lithium — and pays with 300% swelling. Nanostructure or blend it.');
    if(st.act==='LFP') notes.push('LFP: modest capacity, near-immortal cycling, no thermal drama.');
    notes.push('Every electrode is a traffic problem: ions down the pores, electrons through the solid.');
    const score=clamp(Math.round(c.eDen/8+c.rate*6+Math.min(c.life,3000)/3000*30-(c.heat>6?(c.heat-6)*6:0)-fails.length*13),0,100);
    Bench.finish('battery',score,notes,fails); });
  out(); }

/* ═════════ 9 · LOW-COST SOLAR ABSORBER ═════════ */
function openSolar(opts={}){
  const st={abs:'halide perovskite',thick:500,top:'graphene',transport:'TiO₂',enc:true,env:{humid:false,heat:false,uv:false}};
  const AB={'halide perovskite':{gap:1.55,eff0:24,stab:2,cost:1.4,temp:120},'silicon':{gap:1.12,eff0:22,stab:5,cost:3.2,temp:900},
    'organic PV':{gap:1.6,eff0:15,stab:2.6,cost:1.2,temp:110},'GaAs':{gap:1.42,eff0:28,stab:4.4,cost:40,temp:700}};
  const TOP={'graphene':{T:97,cost:2.4},'ITO':{T:91,cost:1.6},'silver nanowires':{T:90,cost:1.2}};
  const calc=()=>{ const a=AB[st.abs];
    const absorb=clamp(1-Math.exp(-st.thick/(a.gap>1.5?280:900)),0,1);
    const recomb=st.thick>800? (st.thick-800)/2500 : 0;
    let eff=a.eff0*absorb*(TOP[st.top].T/100)*(1-recomb)*(st.transport==='none'?.75:1);
    let stab=a.stab+(st.enc?2.4:0);
    if(st.env.humid&&st.abs==='halide perovskite'&&!st.enc) eff*=.4;
    if(st.env.heat) eff*=(st.abs==='halide perovskite'?.86:.95);
    if(st.env.uv&&st.abs==='organic PV') eff*=.75;
    const cost=a.cost+TOP[st.top].cost+(st.enc?.8:0)+st.thick/1000;
    return {eff,absorb,recomb,stab,cost,epd:eff/cost}; };
  const out=()=>{ const c=calc();
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>Efficiency</span><b>${c.eff.toFixed(1)} %</b></div>
      <div class="kv"><span>Light absorbed</span><b>${(c.absorb*100).toFixed(0)} %</b></div>
      <div class="kv"><span>Stability</span><b>${'★'.repeat(Math.round(clamp(c.stab,0,5)))+'☆'.repeat(Math.max(0,5-Math.round(clamp(c.stab,0,5))))}</b></div>
      <div class="kv"><span>Cost index</span><b>$${c.cost.toFixed(1)} /unit</b></div>
      <div class="kv"><span>Efficiency per dollar</span><b style="color:var(--opal)">${c.epd.toFixed(2)}</b></div>
      <div class="kv"><span>Process temp</span><b>${AB[st.abs].temp} °C</b></div>`; };
  const side=Bench.chips('Absorber',Object.keys(AB),st.abs)
    +Bench.slider('so-th','Absorber thickness',100,2000,500,50,' nm')
    +Bench.chips('Top electrode',Object.keys(TOP),st.top)
    +Bench.chips('Transport layer',['TiO₂','PEDOT:PSS','none'],st.transport)
    +`<div class="row" style="justify-content:space-between;margin:10px 0"><span class="eyebrow">Encapsulation</span>
      <button class="tog" id="so-enc" role="switch" aria-checked="true"></button></div>
    <div class="eyebrow" style="margin:10px 0 6px">Environmental tests</div>
    <div class="ctl-group"><button class="ctl sm" data-env="humid">Humidity</button>
      <button class="ctl sm" data-env="heat">85 °C</button><button class="ctl sm" data-env="uv">UV soak</button></div>
    <div class="ctl-group" style="margin-top:10px"><button class="ctl sm primary" id="so-score">Score device</button></div>`;
  Bench.open('Solar Device Stack — efficiency per dollar, not per press release',side,(ctx,w,h,t)=>{
    const c=calc();
    // spectrum
    const sx=w*.07,sy=h*.1,sw=w*.5,sh=h*.5;
    for(let i=0;i<40;i++){ const wl=380+i/40*720;
      const hue=wl<450?260:wl<490?230:wl<560?140:wl<590?60:wl<650?30:10;
      const amp=Math.exp(-((wl-560)**2)/120000);
      const absorbed= wl< (1240/AB[st.abs].gap) ? c.absorb : .05;
      const x=sx+i/40*sw;
      ctx.fillStyle=`hsla(${hue},80%,60%,.75)`;
      ctx.fillRect(x,sy+sh-amp*sh,sw/44,amp*sh);
      ctx.fillStyle='rgba(10,10,20,.75)';
      ctx.fillRect(x,sy+sh-amp*sh,sw/44,amp*sh*(1-absorbed));
    }
    ctx.strokeStyle='rgba(246,242,234,.2)'; ctx.strokeRect(sx,sy,sw,sh);
    ctx.fillStyle='rgba(163,156,141,.8)'; ctx.font='8.5px "IBM Plex Mono"'; ctx.textAlign='center';
    ctx.fillText('380 nm',sx+14,sy+sh+14); ctx.fillText('1100 nm',sx+sw-18,sy+sh+14);
    ctx.fillText('■ bright = absorbed · dark = lost',sx+sw/2,sy+sh+14);
    ctx.fillText('bandgap edge '+(1240/AB[st.abs].gap).toFixed(0)+' nm',sx+sw/2,sy-6);
    // device stack
    const dx=w*.66,dy=h*.12,dw=w*.24;
    const layers=[['encapsulation',st.enc?14:0,'rgba(200,220,240,.35)'],['top: '+st.top,10,'rgba(147,220,244,.5)'],
      ['transport: '+st.transport,st.transport==='none'?0:10,'rgba(190,180,240,.45)'],
      ['absorber: '+st.abs,26+st.thick/100,'rgba(232,184,248,.75)'],['back electrode',12,'rgba(200,200,210,.6)']];
    let yy=dy;
    layers.forEach(([n,lh,col])=>{ if(!lh) return;
      ctx.fillStyle=col; ctx.fillRect(dx,yy,dw,lh);
      ctx.strokeStyle='rgba(246,242,234,.25)'; ctx.strokeRect(dx,yy,dw,lh);
      ctx.fillStyle='rgba(235,229,215,.8)'; ctx.font='7.5px "Archivo Narrow"'; ctx.textAlign='left';
      ctx.fillText(n.toUpperCase(),dx+dw+8,yy+lh/2+3); yy+=lh; });
    // photons + charges
    for(let i=0;i<6;i++){ const u=(t*.5+i*.19)%1;
      ctx.strokeStyle='rgba(255,220,120,.8)';
      ctx.beginPath(); ctx.moveTo(dx+10+i*12,dy-30+u*30); ctx.lineTo(dx+6+i*12,dy-22+u*30); ctx.stroke(); }
    for(let i=0;i<5;i++){ const u=(t*.7+i*.23)%1;
      ctx.fillStyle='rgba(147,220,244,.9)';
      ctx.beginPath(); ctx.arc(dx+dw*.3+i*8,yy-14-u*26,1.8,0,7); ctx.fill(); }
    const envOn=Object.entries(st.env).filter(([k,v])=>v).map(([k])=>k);
    if(envOn.length){ ctx.fillStyle='rgba(255,150,110,.85)'; ctx.font='8.5px "Archivo Narrow"'; ctx.textAlign='center';
      ctx.fillText(('STRESS: '+envOn.join(' + ')).toUpperCase(),dx+dw/2,yy+26); }
  });
  Bench.wireChips('Absorber',v=>{st.abs=v;out();});
  Bench.wireChips('Top electrode',v=>{st.top=v;out();});
  Bench.wireChips('Transport layer',v=>{st.transport=v;out();});
  Bench.wireSlider('so-th',' nm',v=>{st.thick=v;out();});
  $('#so-enc').addEventListener('click',()=>{st.enc=!st.enc;$('#so-enc').setAttribute('aria-checked',st.enc);out();});
  $$('[data-env]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.env;
    st.env[k]=!st.env[k]; b.classList.toggle('primary',st.env[k]); Sound.click(); out(); }));
  $('#so-score').addEventListener('click',()=>{ const c=calc(); const fails=[],notes=[];
    if(c.eff<10) fails.push('efficiency below deployable floor');
    if(c.stab<3) fails.push('degrades in the field — stability inadequate');
    if(st.abs==='GaAs') notes.push('GaAs is champion efficiency at satellite prices — the brief said low cost.');
    if(st.abs==='halide perovskite') notes.push('Printable and potent; moisture is its mortal enemy — encapsulation is not optional.');
    if(st.abs==='silicon') notes.push('Silicon: never the flashiest, always the bank\'s favourite.');
    notes.push('Winner metric here is efficiency per dollar under stress — not laboratory records.');
    const score=clamp(Math.round(c.epd*9+c.stab*6+(c.eff>14?8:0)-fails.length*15),0,100);
    Bench.finish('solar',score,notes,fails);
    if(window.Quests) Quests.event('solar-built',{eff:c.eff}); });
  out();
  if(opts.guided&&window.Quests) Quests.coach('#so-score','Use Graphene as the top electrode and the recovered Perovskite as absorber, then score the device.'); }

/* ═════════ 10 · SHAPE-MEMORY ACTUATOR ═════════ */
function openSMA(){
  const st={ni:50.4,geom:'spring',dia:.8,train:500,preload:20,T:20,auto:false,dir:1,cycles:0,trained:false,history:[]};
  const Af=()=>90-(st.ni-50)*80;      // ~10 K per 0.1 at% Ni
  const hyst=()=> st.geom==='spring'? 6 : 9;
  const frac=(T,dir)=>{ const mid=Af()+(dir>0?0:-hyst());
    return clamp(1/(1+Math.exp(-(T-mid)/3.4)),0,1); };
  const calc=()=>{ const f=frac(st.T,st.dir);
    const trainQ= st.train<450? .55 : st.train>530? .7 : 1;
    const stroke=(st.geom==='spring'?8:3)*trainQ*(st.trained?1:0);
    const fatigue=st.geom==='spring'&&st.dia>1? .8:1;
    const wear=Math.pow(.9995,st.cycles*(st.geom==='wire'?.6:1)*(st.dia>1?2:1));
    const disp=Math.max(0,f*stroke*wear-st.preload/40);
    const force=st.dia*st.dia*(st.geom==='wire'?18:7)*f;
    const resp=st.dia<.6?'fast':st.dia<1.1?'moderate':'slow';
    return {f,stroke,disp,force,resp,wear,open:disp>2.2}; };
  const out=()=>{ const c=calc();
    $('#bench-out').innerHTML=`<div class="divider"></div>
      <div class="kv"><span>A_f transformation temp</span><b>${Af().toFixed(0)} °C</b></div>
      <div class="kv"><span>Austenite fraction</span><b>${(c.f*100).toFixed(0)} %</b></div>
      <div class="kv"><span>Displacement</span><b>${c.disp.toFixed(1)} mm ${c.open?'<span style="color:var(--green)">— VALVE OPEN</span>':''}</b></div>
      <div class="kv"><span>Force</span><b>${c.force.toFixed(1)} N ${c.force<8?'<span style="color:var(--verm)">(needs 8)</span>':''}</b></div>
      <div class="kv"><span>Hysteresis</span><b>±${hyst().toFixed(0)} K</b></div>
      <div class="kv"><span>Response</span><b>${c.resp}</b></div>
      <div class="kv"><span>Cycles</span><b>${fmt(st.cycles)} · stroke ${(c.wear*100).toFixed(0)}%</b></div>
      ${st.trained?'':'<p class="tiny" style="color:#ffb8a6;margin-top:6px">⚠ Untrained — set the memorised shape first</p>'}`; };
  const side=Bench.slider('sm-ni','Nickel content',50.0,51.0,50.4,.05,' at%')
    +Bench.chips('Geometry',['wire','spring'],st.geom)
    +Bench.slider('sm-dia','Diameter',0.3,2,0.8,.1,' mm')
    +Bench.slider('sm-train','Training temp',400,560,500,10,' °C')
    +Bench.slider('sm-pre','Preload',0,60,20,5,' N·mm')
    +`<div class="ctl-group" style="margin-top:8px"><button class="ctl sm" id="sm-train-btn">Train memorised shape</button></div>`
    +Bench.slider('sm-T','Temperature',10,110,20,1,' °C')
    +`<div class="ctl-group" style="margin-top:8px"><button class="ctl sm" id="sm-auto">Auto thermal cycle</button>
      <button class="ctl sm" id="sm-fat">×10⁵ cycles</button>
      <button class="ctl sm primary" id="sm-score">Score actuator</button></div>`;
  Bench.open('Shape-Memory Valve — open at 70 °C, close on cooling',side,(ctx,w,h,t)=>{
    if(st.auto){ st.T+=st.dir*.5; if(st.T>105){st.dir=-1;} if(st.T<15){st.dir=1;st.cycles++;}
      $('#sm-T').value=st.T; $('#sm-T-v').textContent=st.T.toFixed(0)+' °C';
      if((st._ot=(st._ot||0)+1)%10===0) out(); }
    const c=calc();
    // valve body
    const vx=w*.3,vy=h*.5;
    ctx.fillStyle='rgba(120,126,146,.25)'; ctx.strokeStyle='rgba(200,204,220,.5)';
    ctx.fillRect(vx-90,vy-34,180,68); ctx.strokeRect(vx-90,vy-34,180,68);
    // fluid channel
    ctx.fillStyle='rgba(147,220,244,.14)'; ctx.fillRect(vx-90,vy-10,180,20);
    // gate
    const open=c.disp/8;
    ctx.fillStyle='#c9ccda';
    ctx.fillRect(vx-8,vy-30+open*22,16,26);
    // flow when open
    if(c.open){ for(let i=0;i<8;i++){ const u=(t*1.4+i*.13)%1;
      ctx.fillStyle='rgba(147,220,244,.8)';
      ctx.beginPath(); ctx.arc(vx-80+u*160,vy+Math.sin(u*9)*4,2.2,0,7); ctx.fill(); } }
    // SMA element
    ctx.strokeStyle=`rgb(${140+c.f*100|0},${120+c.f*60|0},${240-c.f*60|0})`;
    ctx.lineWidth=st.dia*4;
    ctx.beginPath();
    if(st.geom==='spring'){ const nCoil=7, len=44-c.f*16;
      for(let i=0;i<=nCoil*10;i++){ const u=i/(nCoil*10);
        ctx[i?'lineTo':'moveTo'](vx-24+Math.sin(u*Math.PI*2*nCoil)*10,vy-34-8-u*len); } }
    else{ ctx.moveTo(vx,vy-34); ctx.lineTo(vx,vy-34-30-c.f*-10); ctx.lineTo(vx,vy-88+c.f*14); }
    ctx.stroke(); ctx.lineWidth=1;
    ctx.fillStyle='rgba(163,156,141,.8)'; ctx.font='8.5px "IBM Plex Mono"'; ctx.textAlign='left';
    ctx.fillText('NiTi '+st.geom+' · '+(c.f>.5?'austenite (remembered shape)':'martensite (deformed)'),vx-88,vy-72);
    // temperature gauge
    ctx.fillStyle='rgba(246,242,234,.15)'; ctx.fillRect(w*.08,h*.2,10,h*.5);
    const tempF=(st.T-10)/100;
    const tg=ctx.createLinearGradient(0,h*.7,0,h*.2);
    tg.addColorStop(0,'#5aa0d8'); tg.addColorStop(.6,'#d8a05a'); tg.addColorStop(1,'#ff5a36');
    ctx.fillStyle=tg; ctx.fillRect(w*.08,h*.2+(1-tempF)*h*.5,10,tempF*h*.5);
    ctx.fillStyle='rgba(246,242,234,.85)'; ctx.font='10px "IBM Plex Mono"'; ctx.textAlign='left';
    ctx.fillText(st.T.toFixed(0)+' °C',w*.08+16,h*.2+(1-tempF)*h*.5+4);
    // target line at 70
    const y70=h*.2+(1-(70-10)/100)*h*.5;
    ctx.strokeStyle='rgba(255,220,140,.6)'; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(w*.06,y70); ctx.lineTo(w*.12+30,y70); ctx.stroke(); ctx.setLineDash([]);
    // hysteresis loop
    const hx=w*.62,hy=h*.2,hw=w*.3,hh=h*.5;
    ctx.strokeStyle='rgba(246,242,234,.16)'; ctx.strokeRect(hx,hy,hw,hh);
    ctx.fillStyle='rgba(163,156,141,.75)'; ctx.font='8px "IBM Plex Mono"'; ctx.textAlign='center';
    ctx.fillText('temperature →',hx+hw/2,hy+hh+14);
    ctx.save(); ctx.translate(hx-8,hy+hh/2); ctx.rotate(-Math.PI/2); ctx.fillText('displacement →',0,0); ctx.restore();
    [[1,'#93dcf4'],[-1,'#cdbcf7']].forEach(([dir,col])=>{ ctx.strokeStyle=col; ctx.beginPath();
      for(let i=0;i<=60;i++){ const T=10+i/60*100;
        const f2=frac(T,dir); const d2=Math.max(0,f2*(st.geom==='spring'?8:3)*(st.trained?1:0)*c.wear-st.preload/40);
        const px2=hx+i/60*hw, py2=hy+hh-d2/9*hh;
        i?ctx.lineTo(px2,py2):ctx.moveTo(px2,py2); }
      ctx.stroke(); });
    const px2=hx+(st.T-10)/100*hw, py2=hy+hh-c.disp/9*hh;
    ctx.fillStyle='#fff'; ctx.shadowColor='#93dcf4'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(px2,py2,3.4,0,7); ctx.fill(); ctx.shadowBlur=0;
  });
  Bench.wireSlider('sm-ni',' at%',v=>{st.ni=v;out();});
  Bench.wireChips('Geometry',v=>{st.geom=v;out();});
  Bench.wireSlider('sm-dia',' mm',v=>{st.dia=v;out();});
  Bench.wireSlider('sm-train',' °C',v=>{st.train=v;st.trained=false;out();});
  Bench.wireSlider('sm-pre',' N·mm',v=>{st.preload=v;out();});
  Bench.wireSlider('sm-T',' °C',v=>{st.T=v;st.dir=v>st.T?1:st.dir;out();});
  $('#sm-train-btn').addEventListener('click',()=>{ st.trained=true; Sound.glass();
    toast(st.train<450?'Trained — weakly. Higher anneal temp sets the memory better.':
      st.train>530?'Trained — but over-aged; some memory lost.':'Shape memorised. The metal will remember.');
    out(); });
  $('#sm-auto').addEventListener('click',()=>{ st.auto=!st.auto; Sound.click(); });
  $('#sm-fat').addEventListener('click',()=>{ st.cycles+=100000; Sound.click(); out();
    if(calc().wear<.7) toast('Stroke degraded '+((1-calc().wear)*100).toFixed(0)+'% — fatigue','verm','alert'); });
  $('#sm-score').addEventListener('click',()=>{ const fails=[],notes=[];
    if(!st.trained){ toast('Train the actuator first','verm','alert'); return; }
    const af=Af();
    const openAt70= frac(70,1)*(st.geom==='spring'?8:3)*calc().wear-st.preload/40 > 2.2;
    const closedAt40= frac(40,-1)*(st.geom==='spring'?8:3)*calc().wear-st.preload/40 < 1;
    if(!openAt70) fails.push(af>72?'opens too late — A_f above target':'insufficient stroke at 70 °C');
    if(!closedAt40) fails.push('fails to close on cooling — hysteresis or A_f too low');
    if(af<55) fails.push('opens far too early ('+af.toFixed(0)+' °C) — hot days trigger it');
    if(calc().force<8) fails.push('insufficient force against the seal spring');
    if(calc().wear<.7) fails.push('fatigued — stroke lost');
    if(st.geom==='spring') notes.push('Springs multiply stroke and divide force — the eternal actuator bargain.');
    notes.push('A_f moves ~10 K for every 0.1 at% nickel — composition control is everything in NiTi.');
    const score=clamp(Math.round((openAt70?34:8)+(closedAt40?18:4)+(calc().force>=8?18:6)+calc().wear*20-(fails.length*8)),0,100);
    Bench.finish('actuator',score,notes,fails); });
  out(); }

/* ═════════ CHALLENGE DIRECTORY + CARDS ═════════ */
const CH_OPEN={aeroshell:()=>{ nav('loadout'); toast('Quest brief loaded — build the shell'); },
  wearable:openWearable, marine:openMarine, electrode:openElectrode, thermal:openThermal,
  package:openPackage, implant:openImplant, battery:openBattery, solar:openSolar, actuator:openSMA};
const CH_CONCEPT={aeroshell:'specific strength & galvanic compatibility',wearable:'flexible electronics & percolation',
  marine:'electrochemistry & lifetime cost',electrode:'transparency–conductivity trade-off',
  thermal:'heat transfer & ablation',package:'barriers vs biodegradation',implant:'stiffness matching & biocompatibility',
  battery:'transport in microstructures',solar:'photon economics',actuator:'martensitic transformation'};
const CH_OBJECT={aeroshell:'an aerospace shell',wearable:'a skin-mounted strain sensor',marine:'a 25-year hull bracket',
  electrode:'a foldable display layer',thermal:'a re-entry heat shield',package:'a compostable berry package',
  implant:'a femoral stem',battery:'an electrode microstructure',solar:'a solar device stack',actuator:'a self-opening valve'};
function drawChPreview(ctx,id,w,h,t,hover){ ctx.clearRect(0,0,w,h);
  const gl=hover?1:.55; ctx.lineWidth=1.2;
  const P='#cdbcf7',O='#93dcf4',V='#ff6a4a',G='#93dcac';
  switch(id){
    case 'aeroshell':{ ctx.save(); ctx.translate(w/2,h/2); ctx.rotate(Math.sin(t*.5)*.15);
      ctx.strokeStyle=P; ctx.globalAlpha=gl;
      ctx.beginPath(); ctx.moveTo(-30,0); ctx.quadraticCurveTo(0,-10,32,-2); ctx.quadraticCurveTo(36,0,32,2);
      ctx.quadraticCurveTo(0,10,-30,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4,-6); ctx.lineTo(-14,-16); ctx.moveTo(-4,6); ctx.lineTo(-14,16); ctx.stroke();
      ctx.fillStyle=O; ctx.beginPath(); ctx.arc(34+Math.sin(t*4)*2,0,2,0,7); ctx.fill(); ctx.restore(); break; }
    case 'wearable':{ const b=Math.sin(t*2)*.5+.5;
      ctx.strokeStyle=O; ctx.globalAlpha=gl; ctx.beginPath();
      for(let i=0;i<=40;i++){ const u=i/40;
        ctx[i?'lineTo':'moveTo'](10+u*(w-20),h/2+Math.sin(u*Math.PI*7)*8*(1-b*.4)+Math.sin(u*Math.PI)*b*-9); }
      ctx.stroke(); break; }
    case 'marine':{ ctx.globalAlpha=gl; ctx.strokeStyle='rgba(147,220,244,.7)';
      ctx.beginPath(); for(let x=0;x<w;x+=5) ctx.lineTo(x,14+Math.sin(x*.1+t*2)*2); ctx.stroke();
      ctx.fillStyle='rgba(160,166,180,.6)'; ctx.fillRect(w/2-16,22,32,h-30);
      for(let i=0;i<6;i++){ ctx.fillStyle=`rgba(150,70,30,${.3+.3*Math.sin(t+i)})`;
        ctx.beginPath(); ctx.arc(w/2-10+((i*13)%24),30+((i*17)%(h-40)),2.4,0,7); ctx.fill(); } break; }
    case 'electrode':{ const f=Math.abs(Math.sin(t*1.4)); ctx.globalAlpha=gl;
      ctx.save(); ctx.translate(w/2,h/2);
      [[-1],[1]].forEach(([s])=>{ ctx.save(); ctx.rotate(s*f*.7);
        ctx.fillStyle='rgba(147,220,244,.25)'; ctx.fillRect(s>0?0:-22,-16,22,32);
        ctx.strokeStyle=P; ctx.strokeRect(s>0?0:-22,-16,22,32); ctx.restore(); });
      ctx.restore(); break; }
    case 'thermal':{ ctx.globalAlpha=gl;
      const fl=.5+.5*Math.sin(t*3);
      const g=ctx.createLinearGradient(0,h,0,0);
      g.addColorStop(0,`rgba(255,120,50,${.5*fl})`); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(w/2,10,w/2.6,0,Math.PI); ctx.fill();
      ctx.strokeStyle=P; ctx.beginPath(); ctx.arc(w/2,10,w/2.6,0,Math.PI); ctx.stroke();
      ['rgba(60,63,74,.8)','rgba(138,90,58,.8)','rgba(188,216,240,.8)'].forEach((c,i)=>{
        ctx.fillStyle=c; ctx.fillRect(w/2-24,16+i*7,48,6); }); break; }
    case 'package':{ const u=(t*.25)%1; ctx.globalAlpha=gl;
      ctx.strokeStyle=G; ctx.strokeRect(w/2-16,h/2-10+u*6,32,20-u*8);
      ctx.fillStyle=`rgba(150,120,80,${u})`;
      for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(w/2-10+i*6,h/2+12,1.6,0,7); ctx.fill(); } break; }
    case 'implant':{ ctx.globalAlpha=gl;
      ctx.strokeStyle='rgba(235,225,205,.6)';
      ctx.beginPath(); ctx.moveTo(w/2-12,8); ctx.quadraticCurveTo(w/2-20,h/2,w/2-8,h-6);
      ctx.moveTo(w/2+12,8); ctx.quadraticCurveTo(w/2+20,h/2,w/2+8,h-6); ctx.stroke();
      ctx.strokeStyle='#e6e9f2'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(w/2-10,10); ctx.lineTo(w/2,18); ctx.lineTo(w/2,h-14); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(w/2-14,8,5,0,7); ctx.fill(); break; }
    case 'battery':{ ctx.globalAlpha=gl;
      for(let i=0;i<8;i++){ ctx.fillStyle='rgba(90,100,140,.5)';
        ctx.beginPath(); ctx.arc(12+((i*29)%(w-24)),14+((i*17)%(h-24)),5,0,7); ctx.fill(); }
      for(let i=0;i<5;i++){ const u=(t*.5+i*.2)%1;
        ctx.fillStyle=O; ctx.beginPath(); ctx.arc(10+((i*37)%(w-20)),6+u*(h-12),1.8,0,7); ctx.fill(); } break; }
    case 'solar':{ ctx.globalAlpha=gl;
      ['rgba(200,220,240,.4)','rgba(147,220,244,.5)','rgba(232,184,248,.7)','rgba(200,200,210,.5)'].forEach((c,i)=>{
        ctx.fillStyle=c; ctx.fillRect(w/2-22,h/2-8+i*6,44,5); });
      for(let i=0;i<4;i++){ const u=(t*.7+i*.25)%1;
        ctx.strokeStyle='rgba(255,220,120,.8)';
        ctx.beginPath(); ctx.moveTo(w/2-14+i*10,4+u*14); ctx.lineTo(w/2-17+i*10,9+u*14); ctx.stroke(); } break; }
    case 'actuator':{ const f=.5+.5*Math.sin(t*1.6); ctx.globalAlpha=gl;
      ctx.strokeStyle=`rgb(${140+f*100|0},120,${240-f*60|0})`; ctx.lineWidth=2;
      ctx.beginPath(); for(let i=0;i<=40;i++){ const u=i/40;
        ctx[i?'lineTo':'moveTo'](w/2-14+Math.sin(u*Math.PI*8)*7,h-8-u*(26+f*14)); }
      ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle='#c9ccda'; ctx.fillRect(w/2+4,h/2-8+f*8,10,14);
      if(f>.7){ ctx.fillStyle=O; ctx.beginPath(); ctx.arc(w/2+20,h/2+4,2,0,7); ctx.fill(); } break; } }
  ctx.globalAlpha=1; }
function renderChallenges(){ const grid=$('#ch-grid'); if(!grid) return;
  const rank=rankOf(S.xp).i;
  grid.innerHTML=CHALLENGES.map(c=>{ const locked= rank<c.rank;
    const done=S.questsDone[c.id];
    return `<div class="ch-card panel ${locked?'locked':''}" data-ch="${c.id}">
      <div class="row" style="gap:12px;align-items:flex-start">
        <canvas class="chprev" data-chprev="${c.id}" width="86" height="66" style="width:86px;height:66px;flex:none;border-radius:12px;background:rgba(4,4,10,.45)"></canvas>
        <div><div class="ch-meta">${c.tags.map(t=>`<span>◈ ${t}</span>`).join('')}${done?'<span style="color:var(--gold)">✦ CLEARED</span>':''}</div>
        <h3 style="margin-top:6px">${c.n}</h3></div></div>
      <p style="font-size:12px;line-height:1.6;color:var(--pearl-dim)">${c.brief}</p>
      <div class="row" style="justify-content:space-between;margin-top:auto">
        <span class="tiny dim">${locked? 'Unlocks at '+RANKS[Math.min(c.rank,RANKS.length-1)].n : CH_CONCEPT[c.id]}</span>
        <button class="ctl sm ${locked?'':'primary'}" data-chgo="${c.id}">${locked?'Preview':done?'Revisit':'Begin'}</button></div></div>`; }).join('');
  $$('#ch-grid [data-chgo]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const c=CHALLENGES.find(x=>x.id===b.dataset.chgo);
    if(rankOf(S.xp).i<c.rank) openLockedPreview(c); else CH_OPEN[c.id](); }));
  $$('#ch-grid .ch-card').forEach(card=>card.addEventListener('click',()=>{
    const c=CHALLENGES.find(x=>x.id===card.dataset.ch);
    if(rankOf(S.xp).i<c.rank) openLockedPreview(c); else CH_OPEN[c.id](); }));
  if(!renderChallenges._raf){ const loop=()=>{ renderChallenges._raf=requestAnimationFrame(loop);
      if(CURRENT!=='challenges') return;
      const t=now()/1000;
      $$('#ch-grid .chprev').forEach(cv=>{ const card=cv.closest('.ch-card');
        drawChPreview(cv.getContext('2d'),cv.dataset.chprev,86,66,t,card.matches(':hover')); }); };
    loop(); } }
function openLockedPreview(c){ const rank=rankOf(S.xp).i;
  const need=RANKS[Math.min(c.rank,RANKS.length-1)];
  const prog=clamp(S.xp/need.xp*100,0,99);
  openModal(`<div class="panel-title">Challenge preview — locked</div><div class="panel-body">
    <div class="row" style="gap:18px;align-items:flex-start">
      <canvas id="lk-prev" width="220" height="170" style="width:220px;height:170px;border-radius:18px;background:rgba(4,4,10,.5);flex:none"></canvas>
      <div>
        <h2 class="display" style="font-size:32px">${c.n}</h2>
        <p style="font-size:12.5px;line-height:1.7;color:var(--pearl-dim);margin:10px 0">You will design <b>${CH_OBJECT[c.id]}</b> — an interactive build-test-revise bench with real failure modes and scoring.</p>
        <div class="kv"><span>Core concept</span><b style="text-transform:capitalize">${CH_CONCEPT[c.id]}</b></div>
        <div class="kv"><span>Unlocks at</span><b>${need.n} (${fmt(need.xp)} XP)</b></div>
        <div class="pbar" style="grid-template-columns:80px 1fr 50px"><span>Progress</span><div class="tr"><i style="width:${prog}%"></i></div><b>${prog.toFixed(0)}%</b></div>
        <p class="tiny dim" style="margin-top:10px">Earn XP now: scan materials, run Lab protocols, clear open challenges.
        Related materials you can already discover: ${MAT_LIST.filter(id=>!S.discovered[id]).slice(0,3).map(id=>MATERIALS[id].name).join(' · ')||'all found'}.</p>
      </div></div></div>`);
  const cv=$('#lk-prev'); const loop=()=>{ if(!cv.isConnected) return;
    requestAnimationFrame(loop); drawChPreview(cv.getContext('2d'),c.id,220,170,now()/1000,true); }; loop(); }
SCREEN_HOOKS.challenges={enter(){ renderChallenges(); }};

window.Bench=Bench;
