'use strict';
/* ════════════════════════════════════════════════════════════
   ONBOARDING — entering a dormant research universe
   Core activation → identity → constellation → first scan
   ════════════════════════════════════════════════════════════ */
const Onboard={ step:0, scanP:0, holding:false, active:false, seq:0, t0:0,
  st:null, core:null, rings:[], realms:[], arcs:[], neb:null, sheet:null, pulseRings:[],
  camZ:15, camTarget:15, coreGlow:.35, coreTarget:.35, flashV:0,

start(replay){ this.replay=replay; this.active=true; this.seq=0;
  $('#onboard').classList.remove('hidden');
  $('#app').inert=true;
  this.build(); this.go(0); this.bootMsgs();
  if(!this._wired){ this._wired=true; this.wire(); }
  this.loop(); },

build(){ if(this.st||!HAS3D) return;
  const st=GFX.stage($('#ob-canvas'),{bloom:.5,fov:46}); this.st=st;
  const {scene}=st;
  scene.fog=new THREE.FogExp2(0x05050e,.02);
  scene.add(new THREE.AmbientLight(0x7a72b8,.45));
  const key=new THREE.DirectionalLight(0xfff6e6,.9); key.position.set(6,10,8); scene.add(key);
  // ── the Research Core ──
  const core=new THREE.Group();
  const heart=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,2),
    new THREE.MeshPhysicalMaterial({color:0xf3eefe,metalness:.2,roughness:.08,
      emissive:0xcabdf5,emissiveIntensity:.28,transmission:.34,transparent:true,opacity:.9,
      envMapIntensity:2,clearcoat:1,flatShading:true}));
  core.add(heart); this.heart=heart;
  const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7,1),GFX.glass('#cdbcf7',.14));
  core.add(shell); this.shell=shell;
  core.add(GFX.glowSprite('#cabdf5',7,.65)); this.coreSprite=core.children[core.children.length-1];
  // orbital chrome rings
  [[2.6,.5,0],[3.3,-.4,.8],[4.1,.25,-.6]].forEach(([r,rx,rz],i)=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.03,10,180),GFX.chrome('#d9d5e6',.18));
    ring.rotation.set(Math.PI/2+rx,0,rz); core.add(ring); this.rings.push(ring); });
  // inner particle swirl
  const swirl=GFX.particles(180,5.5,{color:'#93dcf4',size:.3,opacity:.5});
  core.add(swirl); this.swirl=swirl;
  scene.add(core); this.core=core;
  // ── distant material realms ──
  Object.entries(REGIONS).forEach(([k,R],i)=>{ const a=i/6*Math.PI*2+.5;
    const g=new THREE.Group();
    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),GFX.crystal(R.color));
    orb.material.emissiveIntensity=.12;
    g.add(orb); g.add(GFX.glowSprite(R.color,2.6,.3));
    const rg=GFX.ring(.95,R.color,.28); rg.rotation.x=Math.PI/2.3; g.add(rg);
    g.position.set(Math.cos(a)*13.5,Math.sin(a*2)*2.2-1,Math.sin(a)*13.5-4);
    g.userData={key:k,orb,glow:g.children[1],baseY:g.position.y,ph:i};
    scene.add(g); this.realms.push(g); });
  // ── liquid chrome framing arcs ──
  [[-8.5,.6],[8.5,-.6]].forEach(([x,rz],i)=>{
    const arc=new THREE.Mesh(new THREE.TorusGeometry(7,.14,16,120,Math.PI*.75),GFX.chrome('#e7e4f0',.1));
    arc.position.set(x,-1,-3); arc.rotation.set(.3,i?-.7:.7,rz+(i?2.4:-.6));
    st.scene.add(arc); this.arcs.push(arc); });
  // nebula
  this.neb=GFX.particles(S.settings.fx==='low'?260:760,70,{color:'#9d8fd8',size:.5,opacity:.5,ySpread:38});
  this.neb.position.z=-12; scene.add(this.neb);
  const neb2=GFX.particles(S.settings.fx==='low'?120:340,46,{color:'#93dcf4',size:.32,opacity:.4,ySpread:26});
  neb2.position.z=-6; scene.add(neb2); this.neb2=neb2;
  // ── unknown graphene sheet (hidden until scan step) ──
  this.buildSheet(scene);
  st.camera.position.set(0,.4,this.camZ);
},

buildSheet(scene){ const N=420, chaos=new Float32Array(N*3), latt=new Float32Array(N*3);
  const cols=24, a=.42; let n=0;
  for(let r=0;r<Math.ceil(N/cols)&&n<N;r++) for(let c=0;c<cols&&n<N;c++){
    latt[n*3]=(c*1.5+(r%2?.75:0))*a-7.4; latt[n*3+1]=(r*.866)*a-1.5; latt[n*3+2]=0;
    const th=n*2.4, R=2+((n*73)%40)/9;
    chaos[n*3]=Math.cos(th)*R; chaos[n*3+1]=Math.sin(th*1.6)*R*.6; chaos[n*3+2]=Math.sin(th)*R*.5;
    n++; }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(chaos.slice(),3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.22,map:GFX.sprite('rgba(255,255,255,.95)','rgba(139,108,240,0)'),
    color:0xd8cef8,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
  pts.userData={chaos,latt}; pts.visible=false; pts.position.z=6;
  scene.add(pts); this.sheet=pts; },

wire(){
  document.addEventListener('click',e=>{ if(e.target.closest('[data-obnext]')){
    if(this.step===0) this.go(1);
  } else{ const choice=e.target.closest('[data-obchoice]'); if(choice) this.finish(choice.dataset.obchoice); } });
  $('#ob-skip').addEventListener('click',()=>this.finish('free'));
  $('#ob-name-go').addEventListener('click',()=>this.initialise());
  const inp=$('#ob-name');
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') this.initialise(); });
  inp.addEventListener('input',()=>{ Sound.tone(700+inp.value.length*60,.08,'sine',.25);
    this.coreTarget=.5+inp.value.length*.06;
    this.drawConstellation(inp.value,false); });
  window.addEventListener('pointermove',e=>{ this.mx=(e.clientX/innerWidth-.5)*2; this.my=(e.clientY/innerHeight-.5)*2; });
},

bootMsgs(){ const msgs=['Calibrating material space','Mapping atomic structures','Preparing first specimen'];
  let i=0; clearInterval(this._bm);
  this._bm=setInterval(()=>{ if(this.step!==0){clearInterval(this._bm);return;}
    i=(i+1)%msgs.length; const el=$('#ob-boot-msg'); if(el) el.textContent=msgs[i]; },1800); },

go(n){ this.step=n; Sound.glass();
  $$('.ob-step').forEach(s=>s.classList.toggle('on',+s.dataset.ob===n));
  $$('.obp').forEach((p,i)=>{ p.classList.toggle('on',i===n); p.classList.toggle('done',i<n); });
  if(n===1){ const inp=$('#ob-name'); inp.value= S.name==='ALICE'&&!this.replay? '' : S.name;
    this.coreTarget=.55; setTimeout(()=>inp.focus(),450);
    this.drawConstellation(inp.value,false); }
  if(n===2){ this.scanP=0; this._scanDone=false;
    if(this.sheet){ this.sheet.visible=true; this.camTarget=10; }
    $('#ob-constellation').style.opacity=0; }
  if(n===3){ this.coreTarget=1.2; }
  setTimeout(()=>{const step=$(`.ob-step[data-ob="${n}"]`);const target=step&&step.querySelector('input,button');if(target)target.focus();},80); },

drawConstellation(name,complete){ const cv=$('#ob-constellation'); if(!cv) return;
  cv.style.opacity=.95;
  const x=cv.getContext('2d'); x.clearRect(0,0,560,200);
  const letters=(name||'').toUpperCase().split('').filter(c=>/[A-Z0-9]/.test(c)).slice(0,14);
  if(!letters.length) return;
  const pts=letters.map((ch,i)=>{ const code=ch.charCodeAt(0);
    return [60+i*(440/Math.max(letters.length-1,1))+((code*7)%26)-13, 46+((code*13)%108)]; });
  x.strokeStyle=complete?'rgba(205,188,247,.75)':'rgba(205,188,247,.3)'; x.lineWidth=.8;
  for(let i=1;i<pts.length;i++){ x.beginPath(); x.moveTo(...pts[i-1]); x.lineTo(...pts[i]); x.stroke(); }
  if(complete&&pts.length>2){ x.beginPath(); x.moveTo(...pts[pts.length-1]); x.lineTo(...pts[0]); x.stroke(); }
  pts.forEach(([px,py],i)=>{ const r=complete?3.2:2.3;
    const g=x.createRadialGradient(px,py,.5,px,py,r*4);
    g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(.4,'rgba(205,188,247,.5)'); g.addColorStop(1,'transparent');
    x.fillStyle=g; x.beginPath(); x.arc(px,py,r*4,0,7); x.fill();
    x.fillStyle='#fff'; x.beginPath(); x.arc(px,py,r*.55,0,7); x.fill(); });
  x.fillStyle='rgba(163,156,141,.85)'; x.font='8.5px "Archivo Narrow"'; x.textAlign='center';
  x.letterSpacing='3px';
  x.fillText('PERSONAL CONSTELLATION // '+(complete?'FORMED':'FORMING'),280,192); },

initialise(){ if(this._init) return; this._init=true;
  const v=$('#ob-name').value.trim().toUpperCase();
  S.name=v||'ALICE'; save(); renderHUD();
  this.drawConstellation(S.name,true);
  Sound.discover();
  // 1 pulse into core → 2 constellation → 3 realms ignite → 4 arcs unfold → 5 dive
  this.coreTarget=2.2;
  if(HAS3D&&this.st){ this.pulse();
    this.realms.forEach((r,i)=>setTimeout(()=>{ r.userData.orb.material.emissiveIntensity=.9;
      r.userData.glow.material.opacity=.85; Sound.tone(500+i*90,.3,'sine',.3); },500+i*160));
    setTimeout(()=>{ this.arcs.forEach((a,i)=>a.userData={spin:(i?1:-1)*.035}); },1400);
    setTimeout(()=>{ this.camTarget=1.2; },2000);           // dive through the core
    setTimeout(()=>{ this.flashV=1; Sound.glass(); },2850);
    setTimeout(()=>{ this.camZ=10; this.camTarget=10; this.st.camera.position.z=10;
      this.coreTarget=.0; this.core.visible=false;
      this.arcs.forEach(a=>a.visible=false);
      this.go(2); this._init=false; },3050); }
  else{ setTimeout(()=>{ this.go(2); this._init=false; },800); } },

pulse(){ if(!this.st) return;
  const ring=GFX.ring(1.4,'#cdbcf7',.85,.05); ring.rotation.x=Math.PI/2.4;
  this.st.scene.add(ring); this.pulseRings.push({m:ring,t:0}); },

loop(){ if(!this.active) return;
  requestAnimationFrame(()=>this.loop());
  const rm=document.documentElement.dataset.motion==='reduced';
  // automatic cinematic scan (works with or without WebGL)
  if(this.step===2){
    if(this.scanP<1){ this.scanP=Math.min(1,this.scanP+.012);
      if(Math.random()<.22) Sound.scan(this.scanP); }
    const hz=$('#ob-hold-zone'); const p=this.scanP;
    hz.style.background=`conic-gradient(rgba(147,220,244,.85) ${p*360}deg, rgba(147,220,244,.08) ${p*360}deg)`;
    hz.style.webkitMask='radial-gradient(circle, transparent 63%, #fff 64%, #fff 68%, transparent 69%)';
    hz.style.mask='radial-gradient(circle, transparent 63%, #fff 64%, #fff 68%, transparent 69%)';
    $('#ob-scan-hint').textContent= p>=1? 'Lattice resolved.' : 'Resolving lattice… '+Math.round(p*100)+'%';
    if(p>=1&&!this._scanDone){ this._scanDone=true; this.flashV=.8; Sound.discover();
      setTimeout(()=>this.go(3),850); } }
  // flash decay
  if(this.flashV>0){ this.flashV=Math.max(0,this.flashV-.03);
    $('#ob-flash').style.opacity=this.flashV; }
  if(!HAS3D||!this.st) return;
  const t=now()/1000; const st=this.st;
  st.setSize($('#onboard').clientWidth,$('#onboard').clientHeight);
  // core life
  this.coreGlow=lerp(this.coreGlow,this.coreTarget,.04);
  if(this.core&&this.core.visible){
    this.heart.material.emissiveIntensity=this.coreGlow*(rm?1:(0.85+.15*Math.sin(t*2.2)));
    this.coreSprite.material.opacity=clamp(this.coreGlow*.35,.1,.9);
    if(!rm){ this.core.rotation.y=t*.06; this.heart.rotation.y=-t*.14; this.heart.rotation.x=Math.sin(t*.2)*.3;
      this.shell.rotation.y=t*.045; this.shell.rotation.z=t*.03;
      this.rings.forEach((r,i)=>{ r.rotation.z+=(.0009+(i*.0005)); });
      this.swirl.rotation.y=t*.22; this.swirl.userData.drift(t,.2); } }
  // realms idle
  this.realms.forEach(r=>{ if(!rm){ r.position.y=r.userData.baseY+Math.sin(t*.5+r.userData.ph)*.35;
    r.rotation.y=t*.2+r.userData.ph; } });
  // arcs unfold
  this.arcs.forEach(a=>{ if(a.userData&&a.userData.spin&&!rm) a.rotation.z+=a.userData.spin; });
  // nebula
  if(!rm){ this.neb.userData.drift(t,.5); this.neb2.userData.drift(t*1.2,.35); }
  // pulse rings expand
  this.pulseRings=this.pulseRings.filter(p=>p.t<1);
  this.pulseRings.forEach(p=>{ p.t+=.02; p.m.scale.setScalar(1+p.t*9);
    p.m.material.opacity=.85*(1-p.t); if(p.t>=1) st.scene.remove(p.m); });
  // sheet morph (chaos → lattice with scanP)
  if(this.sheet&&this.sheet.visible){ const g=this.sheet.geometry.attributes.position;
    const {chaos,latt}=this.sheet.userData; const p=this.step>=3?1:this.scanP;
    this.sheet.material.opacity=Math.min(1,.25+p*.75+(this.step===2?.3:0));
    for(let i=0;i<g.count;i++){ const k=i*3;
      const rip= rm?0 : Math.sin(latt[k]*1.2+t*1.4)*Math.cos(latt[k+1]*1.6+t)*(.25*p);
      g.array[k]=lerp(chaos[k],latt[k],p)+(rm?0:Math.sin(t*.7+i)*.05*(1-p)*3);
      g.array[k+1]=lerp(chaos[k+1],latt[k+1],p)+(rm?0:Math.cos(t*.6+i*1.3)*.05*(1-p)*3);
      g.array[k+2]=lerp(chaos[k+2],0,p)+rip; }
    g.needsUpdate=true;
    if(!rm) this.sheet.rotation.y=Math.sin(t*.14)*.25; }
  // camera
  this.camZ=lerp(this.camZ,this.camTarget,.03);
  st.camera.position.x=lerp(st.camera.position.x,(this.mx||0)*.9,.05);
  st.camera.position.y=lerp(st.camera.position.y,.4-(this.my||0)*.6,.05);
  st.camera.position.z=this.camZ;
  st.camera.lookAt(0,0,this.step===2?6:0);
  st.render(); },

finish(choice='free'){ this.active=false; clearInterval(this._bm);
  $('#onboard').classList.add('hidden');
  $('#app').inert=false;
  S.onboardingChoiceSeen=true;
  if(!S.onboarded){ S.onboarded=true;
    if(choice!=='mission'&&!S.discovered.graphene){ discover('graphene','first structural scan'); S.scans++;
      S.msteps=S.msteps||{};S.msteps.graphene=S.msteps.graphene||{};S.msteps.graphene.scan=1;
      addMastery('graphene',120); checkAchievements(); }
    logEntry('Research Core initialised. Identity confirmed: '+S.name+' // Researcher '+S.designation+'.');
    save();
    if(choice==='mission'&&window.FirstMission) FirstMission.begin();
    else nav('core'); }
  else if(choice==='mission'&&window.FirstMission) FirstMission.begin();
  else nav('core');
  save(); } };
