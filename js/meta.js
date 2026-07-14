/* ════════════════ ACHIEVEMENTS ════════════════ */
const SIGIL_PATHS={ hex:'M32 6l22 13v26L32 58 10 45V19z', tri:'M32 8l24 42H8z',
  eye:'M6 32s10-14 26-14 26 14 26 14-10 14-26 14S6 32 6 32zm26-8a8 8 0 100 16 8 8 0 000-16z',
  link:'M20 32h24M26 20l-8 12 8 12M38 20l8 12-8 12', wave:'M6 32c6-12 12-12 18 0s12 12 18 0 8-8 16-4',
  shield:'M32 6l20 8v18c0 14-9 22-20 26-11-4-20-12-20-26V14z', leaf:'M50 12C26 14 12 28 12 50c22 0 36-14 38-38zM12 50L38 24',
  axes:'M10 54V10M10 54h44M22 42l10-14 10 8 12-20', crystal:'M32 4l14 18-14 38-14-38z',
  weave:'M10 22c14-12 30 12 44 0M10 32c14-12 30 12 44 0M10 42c14-12 30 12 44 0' };
function renderAchievements(){ const grid=$('#sigil-grid'); if(!grid) return;
  grid.innerHTML=ACHIEVEMENTS.map(a=>{ const got=S.achievements[a.id];
    return `<div class="sigil ${got?'earned':''}">
      <div class="sg"><svg viewBox="0 0 64 64" width="56" height="56"><path d="${SIGIL_PATHS[a.sig]}" fill="none"
        stroke="${got?'#d8c8a4':'#8f81b8'}" stroke-width="1.6" stroke-linejoin="round"/></svg></div>
      <b>${a.n}</b><small>${a.d}</small>
      ${got?`<small style="color:var(--gold);margin-top:6px">${new Date(got).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</small>`:''}</div>`; }).join(''); }
SCREEN_HOOKS.achievements={enter(){ renderAchievements(); }};
SCREEN_HOOKS.log={enter(){ renderLog(); }};

/* ════════════════ SETTINGS ════════════════ */
function renderSettings(){
  const P=$('#set-present');
  const tog=(label,key,desc)=>`<div class="kv" style="align-items:center"><span>${label}${desc?`<br><small class="dim" style="font-size:9px">${desc}</small>`:''}</span>
    <button class="tog" role="switch" aria-checked="${S.settings[key]}" data-tg="${key}" aria-label="${label}"></button></div>`;
  P.innerHTML= tog('Sound effects','sound')+
    `<div class="kv"><span>Motion intensity</span><select class="tin" style="width:130px;padding:7px 26px 7px 10px;font-size:11px" data-sel="motion">
      <option value="full">Full</option><option value="reduced">Reduced</option></select></div>
    <div class="kv"><span>Visual effects</span><select class="tin" style="width:130px;padding:7px 26px 7px 10px;font-size:11px" data-sel="fx">
      <option value="high">High</option><option value="low">Low</option></select></div>
    <div class="kv"><span>Text size</span><select class="tin" style="width:130px;padding:7px 26px 7px 10px;font-size:11px" data-sel="textsize">
      <option value="normal">Normal</option><option value="large">Large</option></select></div>`
    + tog('Colour-assist markers','colorassist','adds ▲▼ glyphs beside colour-coded values')
    + tog('Autosave','autosave');
  $('#set-profile').innerHTML=`
    <div class="eyebrow" style="margin-bottom:8px">Researcher name</div>
    <div class="row"><input class="tin" id="set-name" maxlength="14" value="${esc(S.name)}" style="flex:1">
      <button class="ctl sm" id="set-name-go">Apply</button></div>
    <p class="tiny dim" style="margin-top:8px">Designation ${esc(S.designation)} is permanent. Identity is yours.</p>
    <div class="divider"></div>
    <button class="ctl sm" id="set-replay">Replay onboarding</button>`;
  $('#set-data').innerHTML=`<div class="ctl-group">
      <button class="ctl sm" id="set-export">Export data</button>
      <button class="ctl sm" id="set-import">Import data</button>
      <button class="ctl sm danger" id="set-reset">Reset progress</button>
      <button class="ctl sm" id="set-structtable">Structure validation table</button></div>
    <p class="tiny dim" style="margin-top:10px;line-height:1.6">Progress lives in this browser. Export produces a portable JSON snapshot — the same shape a future backend would sync.</p>`;
  $$('#scr-settings [data-tg]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.tg;
    S.settings[k]=!S.settings[k]; b.setAttribute('aria-checked',S.settings[k]); applySettings(); save(); Sound.click(); }));
  $$('#scr-settings [data-sel]').forEach(sel=>{ sel.value=S.settings[sel.dataset.sel];
    sel.addEventListener('change',()=>{ S.settings[sel.dataset.sel]=sel.value; applySettings(); save(); }); });
  $('#set-name-go').addEventListener('click',()=>{ const v=$('#set-name').value.trim().toUpperCase()||'ALICE';
    S.name=v; save(); renderHUD(); toast(`Identity updated — ${v}`); });
  $('#set-replay').addEventListener('click',()=>{ Onboard.start(true); });
  $('#set-export').addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='materidex-save.json'; a.click();
    toast('Snapshot exported'); });
  $('#set-import').addEventListener('click',()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
    inp.addEventListener('change',()=>{ const f=inp.files[0]; if(!f) return; const rd=new FileReader();
      rd.onload=()=>{ try{ const p=JSON.parse(rd.result); if(!p.ver) throw 0;
          S=Object.assign(DEFAULT_STATE(),p); localStorage.setItem(SAVE_KEY,JSON.stringify(S));
          toast('Data imported — reloading'); setTimeout(()=>location.reload(),700); }
        catch(e){ toast('Import failed — not a Materidex snapshot','verm','alert'); } };
      rd.readAsText(f); }); inp.click(); });
  $('#set-structtable').addEventListener('click',()=>{ openModal('<div class="panel-title">Structure validation — 26 materials</div><div class="panel-body">'+structValidationTable()+'</div>'); });
  $('#set-reset').addEventListener('click',()=>{ openModal(`<div class="panel-title">Reset progress</div><div class="panel-body">
      <p style="font-size:13px;line-height:1.7">Every scan, specimen, sigil and saved loadout will dissolve. This cannot be undone.</p>
      <div class="ctl-group" style="margin-top:16px"><button class="ctl danger" id="reset-yes">Dissolve everything</button>
      <button class="ctl" id="reset-no">Keep my universe</button></div></div>`);
    $('#reset-yes').addEventListener('click',()=>{ localStorage.removeItem(SAVE_KEY); location.reload(); });
    $('#reset-no').addEventListener('click',closeModal); });
}
function applySettings(){ const de=document.documentElement;
  de.dataset.motion= S.settings.motion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced':'full';
  de.dataset.fx=S.settings.fx; de.dataset.textsize= S.settings.textsize==='large'?'large':'normal';
  syncSndBtn(); }
SCREEN_HOOKS.settings={enter(){ renderSettings(); }};

/* ════════════════ BOOT ════════════════ */
window.addEventListener('load',()=>{
  applySettings(); renderHUD(); renderLog(); renderAchievements();
  if(window.Quests) Quests.init();
  BG.init(); Codex.init(); Constellation.init(); Atlas.init(); Lab.init(); Expedition.init(); Loadout.init();
  renderCollection(); renderChallenges(); renderAtlasStatus();
  document.title=BRAND.name+' — '+BRAND.sub;
  $('#app').classList.add('ready');
  // deep-link default screen
  if(S.onboarded&&S.onboardingChoiceSeen){ nav('core'); }
  else{ nav('codex'); Onboard.start(!!S.onboarded); }
  // graceful three.js absence note
  if(!HAS3D) toast('3D acceleration unavailable — running in flat-lattice mode','verm','alert',6000);
});
window.addEventListener('error',e=>{ console.error(e.error||e.message); });
