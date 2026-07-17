'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/collection.js'),'utf8');
const codex=fs.readFileSync(path.join(root,'js/codex.js'),'utf8');
const structures=fs.readFileSync(path.join(root,'js/structures.js'),'utf8');

assert.equal((html.match(/id="specimen3d"/g)||[]).length,1,'Collection must own exactly one persistent specimen canvas');
assert.equal((html.match(/id="specimen3d-wrap"/g)||[]).length,1,'Collection must own exactly one persistent viewer container');
assert.doesNotMatch(source,/collDetail\([^)]*\)[\s\S]{0,180}el\.innerHTML/,'collDetail must not replace the shared viewer panel');
assert.match(source,/this\.three\.r\.domElement!==cv/,'renderer must verify its persistent canvas identity');
assert.match(source,/mountToken/,'specimen requests must carry a stale-render token');
assert.match(source,/token!==this\.mountToken/,'stale specimen requests must be rejected');
assert.match(source,/disposeStructureGroup\(previous\)/,'only the previous specimen group should be disposed');
assert.match(source,/disposeStructureGroup\(next&&next\.group\)/,'a stale built specimen must be disposed');
assert.match(structures,/function disposeStructureGroup\(root\)/,'all structure viewers must share scoped disposal');
assert.match(codex,/scene\.remove\(previous\);disposeStructureGroup\(previous\)/,'candidate switching must dispose only the replaced Codex structure');
assert.doesNotMatch(source,/renderer\.dispose\(|\.r\.dispose\(|scene\.clear\(|\.sc\.clear\(/,'shared rendering infrastructure must not be disposed or cleared');
assert.match(source,/ResizeObserver/,'viewer must respond to container resizing');
assert.match(source,/webglcontextlost/,'viewer must handle WebGL context loss');
assert.match(source,/webglcontextrestored/,'viewer must handle WebGL context restoration');
assert.equal((source.match(/requestAnimationFrame\(\(\)=>this\.loop\(\)\)/g)||[]).length,1,'Vault3D must own exactly one animation-loop scheduler');

/* Exercise sequential and rapid replacement against a persistent stage. */
const frames=[],built=[],disposed=[],cv={},wrap={clientWidth:600,clientHeight:400,addEventListener(){},setPointerCapture(){}},generic={style:{},classList:{contains(){return false;}},addEventListener(){},setAttribute(){},querySelector(){return null;}};
const context={console,window:{devicePixelRatio:1},MATERIALS:{a:{name:'A'},b:{name:'B'},c:{name:'C'}},HAS3D:true,CURRENT:'collection',S:{settings:{fx:'high'}},SCREEN_HOOKS:{},MAT_LIST:[],SETS:[],REGIONS:{},MASTERY_NAMES:[],
  requestAnimationFrame(fn){frames.push(fn);},ResizeObserver:undefined,now(){return 0;},lerp(a,b){return b;},clamp(v){return v;},
  $:selector=>selector==='#specimen3d-wrap'?wrap:selector==='#specimen3d'?cv:generic,$$(){return [];},
  buildStructure(id){built.push(id);return{group:{id,rotation:{x:0,y:0},userData:{},scale:{x:1,multiplyScalar(v){this.x*=v;},setScalar(){}},traverse(){}}};},
  disposeStructureGroup(group){disposed.push(group.id);},drawPodGlyph(){},toast(){},save(){},logEntry(){},addCredits(){},masteryLevel(){return{lv:0};},Codex:{show(){}},nav(){},Sound:{click(){},glass(){}}
};context.window.devicePixelRatio=1;vm.createContext(context);vm.runInContext(source+'\nthis.__Vault3D=Vault3D;',context,{filename:'js/collection.js'});
const vault=context.__Vault3D,scene={nodes:[],add(group){this.nodes.push(group);},remove(group){this.nodes=this.nodes.filter(node=>node!==group);}};
vault.three={r:{domElement:cv,getPixelRatio(){return 1;},setPixelRatio(){}},sc:scene,cam:{position:{set(){}},lookAt(){}},st:{setSize(){},render(){}}};
vault.mount('a');frames.shift()();assert.equal(vault.activeId,'a');assert.deepEqual(built,['a']);assert.equal(scene.nodes.length,1);
vault.mount('b');frames.shift()();assert.equal(vault.activeId,'b');assert.deepEqual(disposed,['a']);assert.equal(scene.nodes.length,1);
vault.mount('a');vault.mount('b');vault.mount('c');while(frames.length)frames.shift()();
assert.deepEqual(built,['a','b','c'],'rapid requests must build only the latest pending specimen');assert.equal(vault.activeId,'c');assert.deepEqual(disposed,['a','b']);assert.equal(scene.nodes.length,1,'repeated mounting must retain one active specimen');

console.log('Collection viewer lifecycle: sequential and rapid switching, one canvas, one loop, scoped disposal, resize and context recovery passed');
