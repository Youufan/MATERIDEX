'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),dataContext={module:{exports:{}},exports:{}};vm.createContext(dataContext);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+'\nthis.__MATERIALS=MATERIALS;this.__MAT_LIST=MAT_LIST;',dataContext,{filename:'js/data.js'});
const MATERIALS=dataContext.__MATERIALS,MAT_LIST=dataContext.__MAT_LIST,labSource=fs.readFileSync(path.join(root,'js/lab.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css/screens.css'),'utf8');

assert.match(html,/id="lab-viewer-header"[\s\S]*id="lab-viewer-controls"[\s\S]*id="lab-status-row"[\s\S]*id="lab-visual"/,'viewer must use controls, status, and visual rows');
assert.match(css,/#lab-stage\{[^}]*display:grid;grid-template-rows:auto minmax\(0,1fr\)/);
assert.match(css,/#lab-viewbar\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
assert.match(css,/#lab-alert\.on\{display:flex\}/);assert.doesNotMatch(css,/#lab-alert\{[^}]*position:absolute/);
assert.match(labSource,/drawStage\(eps,M\)\{ const cv=this\.cv,wrap=\$\('#lab-visual'\)/);
assert.doesNotMatch(labSource,/fillText\(\('TENSILE TEST/,'simulation status must not be painted into the specimen canvas');

const gradient={addColorStop(){}},makeContext=()=>new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='createLinearGradient'||key==='createRadialGradient')return()=>gradient;if(key==='measureText')return text=>({width:String(text).length*6});return()=>{};},set(target,key,value){target[key]=value;return true;}});
const ctx2d=makeContext(),visual={clientWidth:900,clientHeight:320},status={textContent:'',hidden:false},alertState={on:false},alert={classList:{contains(name){return name==='on'&&alertState.on;}}};
const canvas={width:0,height:0,clientWidth:260,clientHeight:188,getContext(){return ctx2d;}},generic={style:{},classList:{add(){},remove(){},contains(){return false;}},textContent:'',value:0,innerHTML:'',addEventListener(){},setAttribute(){},parentElement:{parentElement:{style:{}}}};
const context={console,window:{Quests:null},MATERIALS,MAT_LIST,S:{discovered:{},settings:{fx:'high'},simResults:[]},SCREEN_HOOKS:{},CURRENT:'lab',PR:1,Path2D:class{moveTo(){}lineTo(){}closePath(){}},
  document:{documentElement:{dataset:{motion:'reduced'}}},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,now:()=>0,
  $:selector=>selector==='#lab-visual'?visual:selector==='#lab-status-text'?status:selector==='#lab-alert'?alert:generic,$$:()=>[],Sound:{},toast(){},grant(){},addXP(){},spendCredits(){return true;},addMastery(){},checkAchievements(){},logEntry(){},save(){},renderHUD(){},setTimeout(){},requestAnimationFrame(){}};
context.window=context;vm.createContext(context);vm.runInContext(labSource+'\nthis.__Lab=Lab;',context,{filename:'js/lab.js'});const Lab=context.__Lab;
Lab.cv=canvas;Lab.ctx=ctx2d;Lab.ss={...canvas};Lab.heat={...canvas};

const sizes=[{name:'desktop',w:900,h:320},{name:'laptop',w:640,h:280},{name:'tablet',w:480,h:260},{name:'mobile',w:296,h:230}],modes=['structure','continuum','combined','damage'];
const states=[{name:'idle',p:0,r:false,e:false,d:false},{name:'running',p:.2,r:true,e:false,d:false},{name:'paused',p:.35,r:false,e:false,d:false},{name:'critical damage',p:.7,r:false,e:true,d:false},{name:'completed',p:1,r:false,e:true,d:true}];
let renders=0;for(const id of MAT_LIST.filter(id=>MATERIALS[id].sim)){Lab.mat=id;Lab.seedStructures();const M=Lab.model();for(const size of sizes){visual.clientWidth=size.w;visual.clientHeight=size.h;for(const mode of modes){Lab.view=mode;for(const state of states){Lab.running=state.r;Lab.eventFired=state.e;Lab.done=state.d;Lab.t=state.p*Lab.T;alertState.on=state.e;const eps=state.p*M.ef;Lab.drawStage(eps,M);assert.match(status.textContent,new RegExp(state.name==='critical damage'?'Critical damage':state.name[0].toUpperCase()+state.name.slice(1)));assert.equal(status.hidden,state.e);renders++;}}}
  Lab.ss.clientWidth=220;Lab.ss.clientHeight=188;Lab.heat.clientWidth=180;Lab.heat.clientHeight=188;Lab.drawSS(M.ef,M);Lab.drawHeat(M.ef,M);}
for(const {w} of sizes){const {pad,gripW,arrowLen}=Lab.stageMetrics(w),gW0=w-pad*2,maxGW=w-2*(gripW+arrowLen+24);assert.ok(gW0>0,`${w}px specimen width must remain positive`);assert.ok(maxGW>0,`${w}px annotations must fit`);}
assert.equal(renders,MAT_LIST.filter(id=>MATERIALS[id].sim).length*sizes.length*modes.length*states.length);
console.log(`Lab viewer layout: ${renders} material, viewport, mode and state renders plus chart labels passed`);
