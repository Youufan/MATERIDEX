/* ════════════════ CORE ENGINE ════════════════ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const fmt=n=>n.toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const now=()=>performance.now();
const PR = Math.min(window.devicePixelRatio||1, 2);

/* ---------- persistent state ---------- */
const SAVE_KEY='materidex.save.v1';
const DEFAULT_STATE=()=>({
  ver:1, name:'ALICE', designation:'07', onboarded:false, onboardingChoiceSeen:false,
  xp:0, credits:600, streak:1, lastDay:new Date().toDateString(),
  discovered:{}, mastery:{}, dupes:{}, favs:{}, tracked:{},
  scans:0, sims:0, axisPairs:[], achievements:{}, questsDone:{},
  savedSearches:[], recentViewed:[], savedLoadouts:[], simResults:[],
  loadoutSlots:{}, mitigations:{}, compareSel:['cfrp','ti64','alli'],
  msteps:{}, flags:{},
  regionsVisited:{}, expeditionsDone:0, markedLocations:[],
  trackedArc:null, arcProgress:{},
  firstMission:{status:'not-started',step:0,insights:{},tested:false,compared:false,decision:null,screen:'core',lastLearned:''},
  log:[], settings:{sound:true, music:true, motion:'full', fx:'high', textsize:'normal', units:'si', autosave:true, colorassist:false},
});
let S = DEFAULT_STATE();
try{ const raw=localStorage.getItem(SAVE_KEY); if(raw){ const p=JSON.parse(raw); S=Object.assign(DEFAULT_STATE(),p); S.settings=Object.assign(DEFAULT_STATE().settings,p.settings||{});} }catch(e){ console.warn('save load failed',e); }

/* streak */
(function(){ const today=new Date().toDateString();
  if(S.lastDay!==today){ const y=new Date(); y.setDate(y.getDate()-1);
    S.streak = (S.lastDay===y.toDateString()) ? S.streak+1 : 1; S.lastDay=today; } })();

let saveTimer=null;
function save(){ if(!S.settings.autosave) return;
  clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(S)); flashSave(); }catch(e){ toast('Save failed — storage unavailable','verm'); } },300); }
function flashSave(){ const el=$('#hud-sub'); if(!el) return; el.textContent='SAVED · '+BRAND.sub; clearTimeout(flashSave._t); flashSave._t=setTimeout(()=>el.textContent=BRAND.sub,1200); }

/* ---------- sound engine (synthesised, no assets) ---------- */
const Sound={ ctx:null, master:null, enabled:()=>S.settings.sound,
  init(){ if(this.ctx) return; try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.master=this.ctx.createGain(); this.master.gain.value=.16; this.master.connect(this.ctx.destination);}catch(e){} },
  tone(f,dur=.12,type='sine',vol=1,delay=0,sweep=0){ if(!this.enabled()) return; this.init(); if(!this.ctx) return;
    const t=this.ctx.currentTime+delay, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t); if(sweep) o.frequency.exponentialRampToValueAtTime(Math.max(20,f+sweep),t+dur);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol*.5,t+.008); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+.05); },
  click(){ this.tone(2400,.03,'square',.25); this.tone(900,.05,'sine',.3,.005); },
  hover(){ this.tone(1800,.025,'sine',.12); },
  glass(){ this.tone(1320,.4,'sine',.5); this.tone(1980,.5,'sine',.28,.02); this.tone(2640,.6,'sine',.15,.04); },
  scan(p){ this.tone(400+p*900,.06,'sine',.22); },
  discover(){ [523,659,784,1046,1318].forEach((f,i)=>this.tone(f,.5,'sine',.4-i*.05,i*.09)); },
  fail(){ this.tone(220,.3,'sawtooth',.25); this.tone(180,.45,'sawtooth',.2,.08,-60); },
  alert(){ this.tone(660,.12,'square',.22); this.tone(660,.12,'square',.22,.2); },
  snap(){ this.tone(180,.08,'sine',.5,0,120); this.tone(1400,.04,'square',.18,.02); },
  unlock(){ [392,523,659,880].forEach((f,i)=>this.tone(f,.35,'triangle',.35,i*.07)); },
};
document.addEventListener('pointerdown',()=>Sound.init(),{once:true});

/* ---------- toasts ---------- */
const ICONS={ spark:'<svg viewBox="0 0 24 24"><path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/></svg>',
  hex:'<svg viewBox="0 0 24 24"><path d="M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z"/></svg>',
  alert:'<svg viewBox="0 0 24 24"><path d="M12 3L2 20h20zM12 9v5M12 17.5v.5"/></svg>',
  credit:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 10.5c0-1 1.2-1.8 3-1.8s3 .8 3 1.8-1 1.5-3 1.8-3 .8-3 1.8 1.2 1.8 3 1.8 3-.8 3-1.8"/></svg>' };
function toast(msg,kind='',icon='spark',dur=3400){
  const t=document.createElement('div'); t.className='toast '+kind;
  t.innerHTML=`<span class="tico">${ICONS[icon]||ICONS.spark}</span><span>${msg}</span>`;
  $('#toasts').appendChild(t);
  if(kind==='verm') Sound.alert();
  setTimeout(()=>{t.classList.add('out'); setTimeout(()=>t.remove(),500);},dur);
  while($('#toasts').children.length>4) $('#toasts').firstChild.remove();
}

/* ---------- research log ---------- */
function logEntry(text,kind=''){ S.log.unshift({t:Date.now(),text,kind}); S.log=S.log.slice(0,200); save(); renderLog(); }
function renderLog(){ const el=$('#log-list'); if(!el) return;
  el.innerHTML = S.log.length? S.log.map(l=>{
    const d=new Date(l.t); const ts=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    return `<div class="logline ${l.kind}"><span class="lt">${ts}</span><span class="lk"></span><span>${l.text}</span></div>`;}).join('')
  : '<p class="tiny dim" style="padding:10px 0">The log is empty. Scan something.</p>'; }

/* ---------- XP / rank / credits ---------- */
function rankOf(xp){ let r=RANKS[0],i=0; RANKS.forEach((k,j)=>{ if(xp>=k.xp){r=k;i=j;} }); return {r,i,next:RANKS[i+1]||null}; }
function addXP(n,why){ const before=rankOf(S.xp).i; S.xp+=n; const after=rankOf(S.xp);
  toast(`<b>+${n} XP</b>&nbsp; ${why||''}`);
  if(after.i>before){ Sound.unlock(); toast(`Rank ascended — <b>${after.r.n}</b>`,'', 'spark',5000); logEntry(`Rank ascended: ${after.r.n}.`); }
  renderHUD(); save(); }
function addCredits(n,why){ S.credits+=n; toast(`<b>${n>0?'+':''}${fmt(n)}</b>&nbsp;credits ${why||''}`,'','credit'); renderHUD(); save(); }
function spendCredits(n){ if(S.credits<n){ toast('Insufficient research credits','verm','alert'); return false;} S.credits-=n; renderHUD(); save(); return true; }

/* ---------- achievements ---------- */
function grant(id){ if(S.achievements[id]) return; const a=ACHIEVEMENTS.find(x=>x.id===id); if(!a) return;
  S.achievements[id]=Date.now(); Sound.unlock();
  toast(`Sigil earned — <b>${a.n}</b>`,'','hex',5200); logEntry(`Achievement sigil assembled: ${a.n}.`,'opal');
  renderAchievements(); renderHUD(); save(); }
function checkAchievements(){
  if(S.scans>=1) grant('first_scan');
  if(S.sims>=10) grant('ten_sims');
  if(SETS[0].ids.every(id=>S.discovered[id])) grant('carbon_cart');
  if(Object.keys(S.discovered).length>=12) grant('matter_weaver');
  if(S.axisPairs.length>=3) grant('prop_explorer');
}

/* ---------- discovery / mastery ---------- */
function discover(id,src){ const m=MATERIALS[id]; if(!m) return;
  if(S.discovered[id]){ S.dupes[id]=(S.dupes[id]||0)+1; toast(`Duplicate ${m.name} sample logged`,'','hex'); save(); renderCollection(); return; }
  S.discovered[id]=Date.now(); S.streakTouch=true; Sound.discover();
  toast(`Material added to personal vault — <b>${m.name}</b>`,'','hex',4600);
  logEntry(`${m.name} (${m.code}) crystallised into the Collection${src?' — '+src:''}.`);
  addXP(m.rarity==='legendary'?240:m.rarity==='epic'?160:m.rarity==='rare'?110:70,`· ${m.name} discovered`);
  renderCollection(); renderAtlasStatus(); renderHUD(); checkAchievements(); save();
  if(window.Quests&&Quests.event) Quests.event('discover',{id});
  const nb=$('#coll-badge'); if(nb){ nb.style.display='flex'; nb.textContent=Object.keys(S.discovered).length; } }
const MASTERY_XP_PER_LEVEL=400,MASTERY_MAX_LEVEL=6,MASTERY_MAX_XP=MASTERY_XP_PER_LEVEL*MASTERY_MAX_LEVEL;
function addMastery(id,n){ S.mastery[id]=Math.min(MASTERY_MAX_XP,Math.max(0,(S.mastery[id]||0)+n)); save(); }
function masteryLevel(id){ const tot=Math.min(MASTERY_MAX_XP,Math.max(0,S.mastery[id]||0)),lv=Math.min(MASTERY_MAX_LEVEL,Math.floor(tot/MASTERY_XP_PER_LEVEL)),maxed=lv===MASTERY_MAX_LEVEL;
  const xp=maxed?MASTERY_XP_PER_LEVEL:tot%MASTERY_XP_PER_LEVEL;return {lv,xp,tot,maxed,pct:maxed?100:xp/MASTERY_XP_PER_LEVEL*100}; }
function materialMilestones(id){ const m=(S.msteps&&S.msteps[id])||{};return [!!S.discovered[id],!!m.scan,!!m.bond,!!m.sim,!!m.cmp,!!m.apply||Object.values(S.loadoutSlots||{}).includes(id),!!m.quiz]; }
function materialProgress(id){ const steps=materialMilestones(id),done=steps.filter(Boolean).length;return {steps,done,total:steps.length,pct:Math.round(done/steps.length*100)}; }
const MASTERY_NAMES=['Untouched','Novice','Apprentice','Adept','Advanced','Expert','Mastered'];

/* ---------- HUD ---------- */
function renderHUD(){
  const {r,next}=rankOf(S.xp);
  $('#hud-name').innerHTML=`${esc(S.name)} <em>// RESEARCHER ${esc(S.designation)}</em>`;
  const hr=$('#hud-rank'); hr.querySelector('b').textContent=r.n;
  hr.querySelector('.bar i').style.width= next? (100*(S.xp-r.xp)/(next.xp-r.xp))+'%' : '100%';
  hr.title=`${fmt(S.xp)} XP ${next? '· '+fmt(next.xp-S.xp)+' to '+next.n : '· apex rank'}`;
  $('#hud-credits b').textContent=fmt(S.credits);
  $('#hud-streak b').textContent=S.streak+' ✦';
  const nDisc=Object.keys(S.discovered).length;
  $('#hud-const').textContent=nDisc+' ★';
  $('#hud-gpa').title=`Personal constellation — ${nDisc} of ${MAT_LIST.length} materials mapped`;
}

/* ---------- navigation ---------- */
let CURRENT='codex';
const SCREENS={core:'scr-core',codex:'scr-codex',index:'scr-index',atlas:'scr-atlas',lab:'scr-lab',expedition:'scr-expedition',
  collection:'scr-collection',loadout:'scr-loadout',challenges:'scr-challenges',log:'scr-log',
  achievements:'scr-achievements',settings:'scr-settings'};
const SCREEN_HOOKS={};   // populated by modules: {enter(),exit()}
function nav(to){ if(!SCREENS[to]) return;
  if(window.FirstMission&&FirstMission.active()){
    const step=FirstMission.state().step,allowed=new Set(['core','codex']);
    if(step>=3)allowed.add('lab');if(step>=4)allowed.add('loadout');if(step>=6)allowed.add('collection');
    if(!allowed.has(to)){toast('That system is available in Free Exploration. Complete or pause the guided mission first.');return;}
  }
  const from=CURRENT; CURRENT=to; Sound.click();
  if(window.Quests&&Quests.event) Quests.event('nav',{to});
  $$('.screen').forEach(sc=>sc.classList.remove('active'));
  $$('.rail-btn').forEach(b=>b.classList.toggle('on',b.dataset.nav===to));
  const el=$('#'+SCREENS[to]); el.classList.add('active');
  if(SCREEN_HOOKS[from]&&SCREEN_HOOKS[from].exit) SCREEN_HOOKS[from].exit();
  if(SCREEN_HOOKS[to]&&SCREEN_HOOKS[to].enter) SCREEN_HOOKS[to].enter();
  BG.pulse();
}
$$('.rail-btn').forEach(b=>{ b.addEventListener('click',()=>nav(b.dataset.nav));
  b.addEventListener('mouseenter',()=>Sound.hover()); });
$('#rail-crest').addEventListener('click',()=>nav('core'));
$('#rail-crest').addEventListener('keydown',e=>{if(e.key==='Enter')nav('core')});
document.addEventListener('click',e=>{ const g=e.target.closest('[data-nav-go]'); if(g) nav(g.dataset.navGo); });
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,textarea')) return;
  const keys={'1':'core','2':'atlas','3':'index','4':'lab','5':'expedition','6':'collection','7':'challenges','8':'loadout','9':'codex'};
  if(keys[e.key]) nav(keys[e.key]);
  if(e.key==='Escape') closeModal();
});

/* ---------- modal ---------- */
function openModal(html){ $('#modal-box').innerHTML='<button class="modal-x" aria-label="Close">✕</button>'+html;
  $('#modal-root').classList.add('open'); Sound.glass();
  $('#modal-box .modal-x').addEventListener('click',closeModal); }
function closeModal(){ $('#modal-root').classList.remove('open'); }
$('#modal-veil').addEventListener('click',closeModal);

/* ---------- profile modal ---------- */
$('#hud-avatar').addEventListener('click',()=>{
  const {r,next}=rankOf(S.xp); const nDisc=Object.keys(S.discovered).length;
  const totalMastery=Object.values(S.mastery).reduce((a,b)=>a+b,0);
  openModal(`<div class="panel-title">Researcher Profile</div><div class="panel-body">
    <h2 class="display" style="font-size:34px">${esc(S.name)} <span class="dim" style="font-size:18px">// RESEARCHER ${esc(S.designation)}</span></h2>
    <div class="divider"></div>
    <div class="grid2">
      <div>
        <div class="kv"><span>Explorer rank</span><b>${r.n}</b></div>
        <div class="kv"><span>Research XP</span><b>${fmt(S.xp)}${next?' / '+fmt(next.xp):''}</b></div>
        <div class="kv"><span>Research credits</span><b>${fmt(S.credits)}</b></div>
        <div class="kv"><span>Discovery streak</span><b>${S.streak} days</b></div>
      </div>
      <div>
        <div class="kv"><span>Materials collected</span><b>${nDisc} / ${MAT_LIST.length}</b></div>
        <div class="kv"><span>Structures scanned</span><b>${S.scans}</b></div>
        <div class="kv"><span>Simulations run</span><b>${S.sims}</b></div>
        <div class="kv"><span>Total mastery</span><b>${fmt(totalMastery)} XP</b></div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="eyebrow" style="margin-bottom:8px">Personal constellation</div>
    <canvas id="profile-const" width="640" height="240" style="width:100%;border-radius:12px;background:rgba(4,4,10,.5)"></canvas>
    <p class="tiny dim" style="margin-top:8px">Each star is a collected material; brightness follows mastery.</p>
  </div>`);
  const cv=$('#profile-const'),ctx=cv.getContext('2d');
  ctx.clearRect(0,0,640,240);
  const ids=Object.keys(S.discovered); const pts=[];
  ids.forEach((id,i)=>{ const m=MATERIALS[id]; if(!m)return;
    const x=60+((i*137.5)%520), y=40+((i*89.7)%160); pts.push([x,y]);
    const ml=masteryLevel(id).lv;
    ctx.fillStyle=m.color; ctx.shadowColor=m.color; ctx.shadowBlur=6+ml*3;
    ctx.beginPath(); ctx.arc(x,y,2+ml*.8,0,7); ctx.fill(); });
  ctx.shadowBlur=0; ctx.strokeStyle='rgba(205,188,247,.14)'; ctx.lineWidth=.6;
  for(let i=1;i<pts.length;i++){ ctx.beginPath(); ctx.moveTo(...pts[i-1]); ctx.lineTo(...pts[i]); ctx.stroke(); }
});

/* ---------- sound toggle ---------- */
function syncSndBtn(){ $('#snd-toggle').classList.toggle('muted',!S.settings.sound); }
$('#snd-toggle').addEventListener('click',()=>{ S.settings.sound=!S.settings.sound; syncSndBtn(); save();
  if(S.settings.sound){Sound.glass(); toast('Sound layer enabled');} else toast('Sound layer muted'); });

/* ---------- background starfield (2D canvas — cheap & always works) ---------- */
const BG={ cv:null,ctx:null,stars:[],pulseT:0,
  init(){ this.cv=$('#bg3d'); this.ctx=this.cv.getContext('2d'); this.resize();
    window.addEventListener('resize',()=>this.resize());
    const n=(S.settings.fx==='low')?60:190;
    for(let i=0;i<n;i++) this.stars.push({x:Math.random(),y:Math.random(),z:Math.random(),
      tw:Math.random()*7,r:Math.random()<.94?(.4+Math.random()*.9):(1.2+Math.random()*1.4),
      hue:Math.random()<.6?'244,240,232':(Math.random()<.5?'205,188,247':'143,216,242')});
    this.loop(); },
  resize(){ this.cv.width=innerWidth*PR; this.cv.height=innerHeight*PR; },
  pulse(){ this.pulseT=1; },
  loop(){ const c=this.ctx,W=this.cv.width,H=this.cv.height,t=now()/1000;
    c.clearRect(0,0,W,H);
    const g=c.createRadialGradient(W*.5,H*.38,0,W*.5,H*.38,Math.max(W,H)*.75);
    g.addColorStop(0,'rgba(26,22,54,.6)'); g.addColorStop(.5,'rgba(10,9,24,.35)'); g.addColorStop(1,'rgba(3,3,9,0)');
    c.fillStyle=g; c.fillRect(0,0,W,H);
    /* aurora veils — slow drifting interference light */
    const rmv=document.documentElement.dataset.motion==='reduced';
    const veil=(x,y,r,hue,alpha)=>{ const vg=c.createRadialGradient(x,y,2,x,y,r);
      vg.addColorStop(0,`hsla(${hue},70%,72%,${alpha})`); vg.addColorStop(1,'transparent');
      c.fillStyle=vg; c.fillRect(x-r,y-r,r*2,r*2); };
    const dt=rmv?0:t;
    veil(W*(.24+.05*Math.sin(dt*.05)),H*(.3+.04*Math.cos(dt*.04)),Math.max(W,H)*.32,258,.05);
    veil(W*(.74+.05*Math.cos(dt*.045)),H*(.62+.05*Math.sin(dt*.06)),Math.max(W,H)*.3,196,.045);
    veil(W*(.55+.06*Math.sin(dt*.03+2)),H*(.2+.04*Math.sin(dt*.05+1)),Math.max(W,H)*.22,286,.04);
    if(this.pulseT>0){ this.pulseT=Math.max(0,this.pulseT-.016);
      c.fillStyle=`rgba(139,108,240,${this.pulseT*.05})`; c.fillRect(0,0,W,H); }
    const rm = document.documentElement.dataset.motion==='reduced';
    for(const s of this.stars){ const tw=rm?.7:(.5+.5*Math.sin(t*1.3+s.tw));
      const px=(s.x+(rm?0:Math.sin(t*.01+s.z*9)*.004*s.z))*W, py=(s.y+(rm?0:Math.cos(t*.008+s.z*7)*.003*s.z))*H;
      c.fillStyle=`rgba(${s.hue},${.16+.5*tw*s.z})`;
      c.beginPath(); c.arc(px,py,s.r*PR,0,7); c.fill(); }
    requestAnimationFrame(()=>this.loop()); } };
