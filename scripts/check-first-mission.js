'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),navHistory=[],persisted=[];
const classList={toggle(){}};
const context={
  console,window:null,S:{firstMission:{status:'not-started',step:0,insights:{}},compareSel:[],msteps:{},discovered:{},trackedArc:'first'},
  CURRENT:'core',SAVE_KEY:'test',saveTimer:null,
  document:{body:{classList},createElement(){return {setAttribute(){},classList,style:{}};},addEventListener(){}},
  localStorage:{setItem(key,value){persisted.push(JSON.parse(value));}},$(){return null;},$$(){return [];},
  MATERIALS:{
    graphene:{name:'Graphene',color:'#9aa7ad'},mxene:{name:'Ti3C2Tx MXene',color:'#42a9b8'},pedot:{name:'PEDOT:PSS',color:'#4e8dff'}
  },
  Codex:{id:null,show(id){this.id=id;context.CURRENT='codex';}},
  Lab:{mat:null,setMaterial(id){this.mat=id;context.CURRENT='lab';}},
  Loadout:{renderTray(){},renderCompare(){}},Sound:{glass(){},discover(){}},
  save(){},toast(){},logEntry(){},openModal(){},closeModal(){},renderCollection(){},collDetail(){},
  discover(id){context.S.discovered[id]=Date.now();},
  nav(to){context.CURRENT=to;navHistory.push(to);},
  setTimeout(fn){fn();}
};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js/first-mission.js'),'utf8'),context,{filename:'js/first-mission.js'});
const mission=context.FirstMission;

mission.begin();
assert.equal(context.CURRENT,'codex');
for(const id of ['graphene','mxene','pedot']){
  assert.equal(context.Codex.id,id);
  mission.recordInsight(id);
}
assert.equal(context.S.firstMission.step,3);
vm.runInContext("CURRENT='lab'",context);context.Lab.mat='pedot';
mission.event('sim-complete',{id:'pedot'});
assert.equal(context.S.firstMission.step,4);
vm.runInContext("CURRENT='loadout'",context);
mission.event('compare',{ids:['graphene','mxene','pedot']});
assert.equal(context.S.firstMission.compareReady,true);
assert.equal(vm.runInContext("CURRENT==='loadout'",context),true);
assert.deepEqual(vm.runInContext('[FirstMission.active(),FirstMission.state().step,FirstMission.state().compareReady]',context),[true,4,true]);
vm.runInContext('FirstMission.action()',context);
assert.equal(context.S.firstMission.step,5);
mission.decide('graphene');
assert.equal(context.S.firstMission.step,5,'a trade-off candidate must not silently complete the decision');
mission.decide('pedot');
assert.equal(context.S.firstMission.step,6);
mission.collect();
assert.equal(context.S.firstMission.status,'complete');
assert.equal(context.S.firstMission.step,7);
assert.ok(context.S.discovered.pedot);
assert.equal(context.CURRENT,'collection');
assert.equal(persisted.at(-1).firstMission.status,'complete');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/screens.css'),'utf8');
assert.match(html,/data-obchoice="mission"[^>]*>Begin First Mission/);
assert.match(html,/data-obchoice="free"[^>]*>Explore Freely/);
assert.match(css,/\.ob-choice-grid\{display:grid/);
assert.match(css,/@media \(max-width:620px\)[\s\S]*?\.ob-choice-grid\{grid-template-columns:1fr/);
assert.match(css,/\.fm-evidence\{display:grid;grid-template-columns:repeat\(3/);
console.log('First Mission journey: 9/9 actions, decision guard, collection unlock, and responsive rules passed');
