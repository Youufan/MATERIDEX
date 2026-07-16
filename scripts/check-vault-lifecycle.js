'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/collection.js'),'utf8');

assert.equal((html.match(/id="specimen3d"/g)||[]).length,1,'Collection must own exactly one persistent specimen canvas');
assert.equal((html.match(/id="specimen3d-wrap"/g)||[]).length,1,'Collection must own exactly one persistent viewer container');
assert.doesNotMatch(source,/collDetail\([^)]*\)[\s\S]{0,180}el\.innerHTML/,'collDetail must not replace the shared viewer panel');
assert.match(source,/this\.three\.r\.domElement!==cv/,'renderer must verify its persistent canvas identity');
assert.match(source,/mountToken/,'specimen requests must carry a stale-render token');
assert.match(source,/token!==this\.mountToken/,'stale specimen requests must be rejected');
assert.match(source,/disposeSpecimen\(previous\)/,'only the previous specimen group should be disposed');
assert.doesNotMatch(source,/renderer\.dispose\(|\.r\.dispose\(|scene\.clear\(|\.sc\.clear\(/,'shared rendering infrastructure must not be disposed or cleared');
assert.match(source,/ResizeObserver/,'viewer must respond to container resizing');
assert.match(source,/webglcontextlost/,'viewer must handle WebGL context loss');
assert.match(source,/webglcontextrestored/,'viewer must handle WebGL context restoration');
assert.equal((source.match(/requestAnimationFrame\(\(\)=>this\.loop\(\)\)/g)||[]).length,1,'Vault3D must own exactly one animation-loop scheduler');

console.log('Collection viewer lifecycle: one canvas, one loop, guarded replacement, scoped disposal, resize and context recovery passed');
