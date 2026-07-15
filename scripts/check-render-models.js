'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const THREE=require('../vendor/three.min.js');
const {ELEMENTS,STRUCTURE_TYPES,STRUCTURE_DATA}=require('../js/structure-data.js');

const canvasContext={font:'',fillStyle:'',fillText(){}};
const context={
  THREE,ELEMENTS,STRUCTURE_TYPES,STRUCTURE_DATA,console,
  document:{createElement(){return {width:0,height:0,getContext(){return canvasContext;}};}}
};

const renderer=fs.readFileSync(path.join(__dirname,'../js/structures.js'),'utf8');
vm.runInNewContext(`${renderer}\nthis.__buildStructure=buildStructure;`,context);

const failures=[];
for(const id of Object.keys(STRUCTURE_DATA)){
  const model=context.__buildStructure(id);
  if(model.unavailable)failures.push(`${id}: unavailable structure`);
  if(!model.group||!model.legend.length)failures.push(`${id}: incomplete render output`);
  if(STRUCTURE_DATA[id].lattice&&!model.cell)failures.push(`${id}: missing repeat boundary`);
}

const mxene=context.__buildStructure('mxene');
const mxeneCounts={};
mxene.records.forEach(record=>{mxeneCounts[record.element]=(mxeneCounts[record.element]||0)+1;});
for(const element of ['Ti','C','O','H','F'])if(!mxeneCounts[element])failures.push(`mxene: missing rendered ${element}`);
const mxeneRoles=mxene.records.map(record=>record.role).join(' ');
for(const plane of ['lower outer Ti plane','lower carbide C plane','central Ti plane','upper carbide C plane','upper outer Ti plane']){
  if(!mxeneRoles.includes(plane))failures.push(`mxene: missing ${plane}`);
}

if(failures.length){
  failures.forEach(failure=>console.error(failure));
  process.exit(1);
}

console.log(`Render construction: ${Object.keys(STRUCTURE_DATA).length}/${Object.keys(STRUCTURE_DATA).length} passed`);
console.log(`MXene rendered species: ${Object.entries(mxeneCounts).map(([element,count])=>`${element} ${count}`).join(', ')}`);
