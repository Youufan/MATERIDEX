'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/first-mission.js'),'utf8');

function makeMission(saved){
  const persisted=[],navHistory=[],labCalls=[],classList={toggle(){}};
  const context={console,window:null,S:saved?JSON.parse(JSON.stringify(saved)):{firstMission:{status:'not-started',step:0,insights:{}},compareSel:[],msteps:{},discovered:{},trackedArc:'first'},
    CURRENT:'core',SAVE_KEY:'test',saveTimer:null,
    document:{body:{classList,appendChild(){}},createElement(){return {setAttribute(){},classList,style:{}};},addEventListener(){}},
    localStorage:{setItem(key,value){persisted.push(JSON.parse(value));}},$(){return null;},$$(){return [];},
    MATERIALS:{graphene:{name:'Graphene',color:'#9aa7ad'},mxene:{name:'Ti3C2Tx MXene',color:'#42a9b8'},pedot:{name:'PEDOT:PSS',color:'#4e8dff'}},
    Codex:{id:null,show(id){this.id=id;context.CURRENT='codex';}},
    Lab:{mat:null,guided:false,setGuided(on,id,owner){this.guided=on;this.guidedOwner=on?owner:null;if(id)this.guidedMaterial=id;},setMaterial(id,options={}){labCalls.push({id,options});if(!context.S.discovered[id]&&!options.guided)return false;this.mat=id;context.CURRENT='lab';return true;}},
    Loadout:{renderTray(){},renderCompare(){}},Sound:{glass(){},discover(){}},
    save(){},toast(){},logEntry(){},openModal(){},closeModal(){},renderCollection(){},collDetail(){},
    discover(id){context.S.discovered[id]=Date.now();},nav(to){context.CURRENT=to;navHistory.push(to);},setTimeout(fn){fn();}
  };
  context.window=context;vm.createContext(context);vm.runInContext(source,context,{filename:'js/first-mission.js'});
  return {context,mission:context.FirstMission,persisted,navHistory,labCalls};
}

const run=makeMission(),{context,mission,persisted,labCalls}=run;
mission.begin();assert.equal(context.CURRENT,'codex');
for(const id of ['graphene','mxene','pedot']){assert.equal(context.Codex.id,id);mission.recordInsight(id);}
assert.equal(context.S.firstMission.step,3);assert.equal(context.S.discovered.pedot,undefined,'mission candidate should remain locked until the decision');
assert.ok(labCalls.some(call=>call.id==='pedot'&&call.options.guided===true),'clean mission must explicitly request guided Lab access');
assert.equal(context.Lab.mat,'pedot','guided access must load the locked mission specimen');

let refreshed=makeMission(persisted.at(-1));refreshed.mission.restore();
assert.equal(refreshed.context.CURRENT,'lab','refresh at the test step must restore the Lab');
assert.equal(refreshed.context.Lab.mat,'pedot');
assert.ok(refreshed.labCalls.some(call=>call.options.guided===true));

vm.runInContext("CURRENT='lab'",context);context.Lab.mat='pedot';mission.event('sim-complete',{id:'pedot'});
assert.equal(context.S.firstMission.step,4);assert.equal(context.S.firstMission.tested,true);
refreshed=makeMission(persisted.at(-1));refreshed.mission.restore();assert.equal(refreshed.context.CURRENT,'loadout','refresh after testing must restore Compare');

vm.runInContext("CURRENT='loadout'",context);mission.event('compare',{ids:['graphene','mxene','pedot']});
assert.equal(context.S.firstMission.compareReady,true);mission.action();assert.equal(context.S.firstMission.step,5);
mission.decide('graphene');assert.equal(context.S.firstMission.step,5,'a trade-off candidate must not silently complete the decision');
mission.decide('pedot');assert.equal(context.S.firstMission.step,6);assert.equal(context.S.firstMission.decision,'pedot');
refreshed=makeMission(persisted.at(-1));assert.equal(refreshed.context.S.firstMission.decision,'pedot','final decision must persist across refresh');
mission.collect();assert.equal(context.S.firstMission.status,'complete');assert.equal(context.S.firstMission.step,7);assert.ok(context.S.discovered.pedot);assert.equal(context.CURRENT,'collection');
assert.equal(persisted.at(-1).firstMission.status,'complete');assert.ok(persisted.at(-1).discovered.pedot,'Collection unlock must persist');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css/screens.css'),'utf8');
const coreSource=fs.readFileSync(path.join(root,'js/core.js'),'utf8'),onboardSource=fs.readFileSync(path.join(root,'js/onboard.js'),'utf8');
const labSource=fs.readFileSync(path.join(root,'js/lab.js'),'utf8');assert.match(labSource,/!S\.discovered\[id\]&&!guided/);assert.match(labSource,/opts\.includes\(this\.guidedMaterial\)/);
assert.match(html,/data-obchoice="mission"[^>]*>Begin First Mission/);assert.match(html,/data-obchoice="free"[^>]*>Explore Freely/);
assert.match(html,/id="specimen-stage" tabindex="0"/,'3D structure viewer must be keyboard reachable');
assert.match(coreSource,/setAttribute\('role','dialog'\)/);assert.match(coreSource,/e\.key==='Tab'/,'modal must trap keyboard focus');
assert.match(onboardSource,/\$\('#app'\)\.inert=true/);assert.match(onboardSource,/\$\('#app'\)\.inert=false/,'onboarding must release the application focus tree');
assert.match(source,/done=Math\.min\(8,1\+st\.step\),current=Math\.min\(9,2\+st\.step\)/,'progress must count completed actions consistently');
assert.match(css,/@media \(max-width:620px\)[\s\S]*?\.ob-choice-grid\{grid-template-columns:1fr/);
assert.doesNotMatch(css,/\.fm-card dl>div:nth-child\(2\)\{display:none\}/,'mobile must retain the learned insight');
assert.match(css,/#scr-lab,#scr-collection,#scr-loadout\{display:flex;flex-direction:column;height:100%;overflow-x:hidden;overflow-y:auto\}/);
console.log('First Mission: clean-state guided access, 9 actions, refresh persistence, decision guard, unlock and responsive access passed');
