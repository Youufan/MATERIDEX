'use strict';
/* Global archive search. The matcher is deliberately local and transparent so a
   future semantic index can replace score() without changing the palette UI. */
const GlobalSearch={open:false,active:0,items:[],lastFocus:null,
  synonyms:{
    transparent:['transparent','optical','transparency'],conductive:['conductive','conductivity','electrical','electrode'],
    polymers:['polymer','elastomer','thermoplastic'],polymer:['polymer','elastomer','thermoplastic'],
    wearable:['wearable','flexible','electrode','sensor'],temperature:['temperature','thermal','heat'],
    stainless:['stainless','steel','alloy'],solar:['solar','photovoltaic','perovskite'],strong:['strong','strength','stiffness']
  },
  init(){this.root=$('#command-palette');this.input=$('#global-search');this.results=$('#global-search-results');if(!this.root)return;
    $('#global-search-open').addEventListener('click',()=>this.show());
    $$('[data-command-close]').forEach(el=>el.addEventListener('click',()=>this.hide()));
    this.input.addEventListener('input',()=>this.render());
    this.input.addEventListener('keydown',e=>this.onInputKey(e));
    document.addEventListener('keydown',e=>{const field=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;
      if((e.key.toLowerCase()==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!field)){e.preventDefault();this.show();}
      else if(e.key==='Escape'&&this.open)this.hide();});
  },
  corpus(){const materials=MAT_LIST.map(id=>{const m=MATERIALS[id],props=(m.props||[]).map(p=>`${p.k} ${p.v} ${p.u}`).join(' ');
      return {kind:'Material',title:m.name,subtitle:`${FAMILIES[m.family].name} · ${m.bonding.structure}`,id,
        text:[m.name,m.formula,m.cls,m.summary,m.desc,m.family,m.bonding.structure,props,...(m.apps||[]),...(m.tags||[])].join(' '),open:()=>{Codex.show(id);nav('codex');}};});
    const families=Object.entries(FAMILIES).map(([id,f])=>({kind:'Family',title:f.name,subtitle:`Browse ${f.name.toLowerCase()} in the Material Index`,id,
      text:`${f.name} ${id} materials family`,open:()=>{nav('index');const input=$('#idx-search');if(input){input.value=f.name;input.dispatchEvent(new Event('input'));}}}));
    const investigations=[
      {kind:'Investigation',title:'First Mission',subtitle:'Lightweight conductive wearable device',text:'guided mission wearable conductive compare structure test collection',open:()=>{nav('core');}},
      {kind:'Expedition',title:'Perovskite Stability',subtitle:'Investigate absorber degradation',text:'perovskite solar cell stability expedition degradation',open:()=>nav('expedition')},
      {kind:'Tool',title:'Comparison Field',subtitle:'Compare materials by intended use',text:'compare properties trade offs application alternatives',open:()=>nav('loadout')}
    ];return [...materials,...families,...investigations];},
  terms(q){return q.toLowerCase().replace(/[^a-z0-9:]+/g,' ').trim().split(/\s+/).filter(Boolean).flatMap(t=>this.synonyms[t]||[t]);},
  score(item,q){const hay=item.text.toLowerCase(),title=item.title.toLowerCase(),terms=this.terms(q);if(!terms.length)return item.kind==='Material'?1:0;
    let score=0;terms.forEach(t=>{if(title===t)score+=12;else if(title.includes(t))score+=7;if(hay.includes(t))score+=2;});
    if(q.toLowerCase().includes('alternatives to')&&item.kind==='Material')score+=2;return score;},
  show(){if(this.open)return;this.lastFocus=document.activeElement;this.open=true;this.root.hidden=false;this.input.value='';this.active=0;this.render();requestAnimationFrame(()=>this.input.focus());},
  hide(){if(!this.open)return;this.open=false;this.root.hidden=true;if(this.lastFocus&&this.lastFocus.focus)this.lastFocus.focus();},
  render(){const q=this.input.value.trim();this.items=this.corpus().map(item=>({item,score:this.score(item,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title)).slice(0,10).map(x=>x.item);
    this.active=clamp(this.active,0,Math.max(0,this.items.length-1));
    this.results.innerHTML=this.items.length?this.items.map((r,i)=>`<button class="command-result ${i===this.active?'active':''}" role="option" aria-selected="${i===this.active}" data-command-index="${i}">
      <span class="command-kind">${r.kind}</span><span><b>${r.title}</b><small>${r.subtitle}</small></span><em>↵</em></button>`).join(''):
      '<div class="command-empty">No matching archive records. Try a material, property, application or structure.</div>';
    $$('[data-command-index]').forEach(b=>{b.addEventListener('mouseenter',()=>{this.active=+b.dataset.commandIndex;this.syncActive();});b.addEventListener('click',()=>this.choose(+b.dataset.commandIndex));});},
  syncActive(){$$('[data-command-index]').forEach((b,i)=>{b.classList.toggle('active',i===this.active);b.setAttribute('aria-selected',String(i===this.active));});},
  onInputKey(e){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();this.active=clamp(this.active+(e.key==='ArrowDown'?1:-1),0,Math.max(0,this.items.length-1));this.syncActive();}
    else if(e.key==='Enter'){e.preventDefault();this.choose(this.active);}else if(e.key==='Escape'){e.preventDefault();this.hide();}},
  choose(i){const result=this.items[i];if(!result)return;this.hide();result.open();}
};
GlobalSearch.init();
