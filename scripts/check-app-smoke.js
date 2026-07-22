'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=[...fs.readdirSync(path.join(root,'css'))].filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(path.join(root,'css',f),'utf8')).join('\n');
const scripts=[...html.matchAll(/src="(js\/[^"?#]+)(?:\?[^"#]*)?"/g)].map(m=>m[1]),source=scripts.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
assert.deepEqual([...new Set(duplicates)],[],'duplicate DOM ids');
const screens=['core','codex','index','atlas','lab','expedition','collection','loadout','challenges','log','achievements','settings'];
for(const route of screens){assert.match(html,new RegExp(`id="scr-${route}"`),`missing ${route} screen`);assert.match(source,new RegExp(`${route}:'scr-${route}'|${route}:\\{`),`missing ${route} routing or hook`);}
for(const id of ['specimen-canvas','specimen3d','lab-canvas','index-canvas','atlas-canvas'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} must be unique`);
for(const control of ['act-scan','act-sim','act-compare','sim-run','exp-track','exp-back']){assert.match(html,new RegExp(`id="${control}"`),`missing ${control}`);assert.match(source,new RegExp(`['"]#${control}|getElementById\\(['"]${control}`),`no handler for ${control}`);}
assert.match(source,/\[data-ci\][\s\S]{0,160}addEventListener/,'comparison selection handler missing');
assert.match(source,/\[data-chgo\][\s\S]{0,120}addEventListener/,'challenge selection handler missing');
assert.match(source,/unhandledrejection/,'global rejected-promise reporting missing');
assert.match(css,/@media \(max-width:820px\)/,'tablet/mobile layout guard missing');assert.match(css,/@media \(max-width:620px\)/,'phone layout guard missing');
assert.match(css,/#scr-lab[^}]*overflow[^}]*auto|#scr-lab,#scr-collection[^}]*overflow[^}]*auto/,'small-screen scrolling guard missing');
for(const file of [...scripts,...[...html.matchAll(/href="((?:css|vendor)\/[^"?#]+)(?:\?[^"#]*)?"/g)].map(m=>m[1])])assert.ok(fs.existsSync(path.join(root,file)),`required local asset missing: ${file}`);
for(const id of ['command-palette','global-search','cmp-use','cmp-context','coll-search'])assert.match(html,new RegExp(`id="${id}"`),`missing refined interface control ${id}`);
assert.match(source,/metaKey\|\|e\.ctrlKey/,'global search keyboard shortcut missing');
assert.match(source,/No universal winner is declared/,'application comparison must retain trade-off framing');
const ctx={module:{exports:{}},exports:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+'\nthis.__MATERIALS=MATERIALS;this.__MAT_LIST=MAT_LIST;',ctx);
const {STRUCTURE_DATA}=require('../js/structure-data.js');for(const id of ctx.__MAT_LIST){assert.ok(ctx.__MATERIALS[id],`missing material ${id}`);assert.ok(STRUCTURE_DATA[id],`detail view lacks structure ${id}`);}
assert.equal((source.match(/requestAnimationFrame\(\(\)=>this\.loop\(\)\)/g)||[]).length>=2,true,'persistent viewers must own animation schedulers');
console.log(`Application smoke contract: ${screens.length} screens, ${ctx.__MAT_LIST.length} material details, controls, assets and responsive guards passed`);
