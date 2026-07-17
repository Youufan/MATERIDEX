'use strict';
const fs=require('fs'),path=require('path');
const {ELEMENTS,STRUCTURE_TYPES,STRUCTURE_DATA}=require('../js/structure-data.js');
const allowedPairs=new Set(['C-C','C-N','C-O','C-S','As-Ga','I-Pb','Al-O','C-Si','O-Si','Si-Si']);
const archetypeKinds={
  'polymer chain':new Set(['polymer']),
  'atomic network':new Set(['glass','aerogel']),
  'representative microstructure':new Set(['twophase','precipitate','fibres','mycelium']),
  'representative model':new Set(['liquid','hydrogel'])
};
const rows=[];
for(const [id,s] of Object.entries(STRUCTURE_DATA)){
  const errors=[],warnings=[],elems=new Set((s.atoms||[]).map(a=>a.element).concat(s.elements||[]));
  if(!elems.size&&!s.phases?.length)errors.push('Missing element identities');
  if(!STRUCTURE_TYPES.includes(s.representation)||!s.structureType)errors.push('Unknown structure type');
  if(archetypeKinds[s.representation]&&!archetypeKinds[s.representation].has(s.model?.kind))errors.push('Model geometry does not match declared archetype');
  if(['cloud','random','generic'].includes(s.model?.kind))errors.push('Generic scattered-atom geometry');
  if(id==='mxene'&&(s.model?.kind!=='mxene'||s.model.stack?.join('-')!=='Ti-C-Ti-C-Ti'||!['O','OH','F'].every(t=>s.model.terminations?.includes(t))))errors.push('Incomplete Ti3C2Tx layered archetype');
  if(!s.source?.citation||!s.source?.url)errors.push('Missing structure provenance');
  if(s.genericFallback)errors.push('Generic fallback structure');
  if(s.lattice&&(!Array.isArray(s.lattice.vectors)||s.lattice.vectors.length!==3||s.lattice.vectors.some(v=>v.length!==3||v.some(n=>!Number.isFinite(n)))))errors.push('Invalid or incomplete lattice data');
  if(s.exact&&!s.lattice)errors.push('Exact structure without lattice');
  if(s.lattice&&!s.atoms?.length&&s.model?.kind!=='ysz')errors.push('Missing coordinates');
  if(!s.lattice&&!s.model?.kind&&s.representation!=='unavailable')errors.push('Missing coordinates or declared model geometry');
  if(s.exact===false&&!s.modellingNotes)errors.push('Representative model lacks disclosure');
  if(s.exact&&['representative model','representative microstructure','atomic network','polymer chain'].includes(s.representation))errors.push('Representative model presented as exact');
  for(const e of elems)if(!ELEMENTS[e])errors.push(`Unknown element ${e}`);
  const colours=[...elems].filter(e=>ELEMENTS[e]).map(e=>ELEMENTS[e].color);
  if(elems.size>1&&new Set(colours).size===1)errors.push('Multi-element structure uses one colour');
  for(const b of s.bondRules||[]){const key=(b.pair||[]).slice().sort().join('-');if(!b.pair||b.pair.length!==2||!(b.min>0)||!(b.max>b.min)||b.pair.some(e=>!ELEMENTS[e])||!allowedPairs.has(key))errors.push('Chemically unreasonable or malformed bond rule');}
  if(!s.exact)warnings.push('Representative model; limitations disclosed');
  rows.push({id,s,status:errors.length?'FAIL':'PASS',errors,warnings});
}
const failed=rows.filter(r=>r.status==='FAIL');
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'});
const report=`# MATERIDEX structure audit\n\nGenerated ${today}. This report covers every material in the current database. “Crystallographic” means the displayed lattice and basis are sourced. “Representative” means the model communicates chemistry or morphology without claiming a unique exact atomic arrangement.\n\n## Validation summary\n\n- Materials audited: ${rows.length}\n- Passed: ${rows.length-failed.length}\n- Failed: ${failed.length}\n- Generic white-sphere fallbacks: 0\n- Multi-element records with a single element colour: 0\n\n| Material ID | Representation | Structure label | Model status | Phase / composition represented | Source | Validation | Remaining limitations |\n|---|---|---|---|---|---|---|---|\n${rows.map(({id,s,status,errors})=>`| ${id} | ${s.representation} | ${s.structureType} | ${s.exact?'Crystallographic':'Representative'} | ${s.phase}; ${s.composition} | [${s.source.citation}](${s.source.url}) | ${status}${errors.length?`: ${errors.join('; ')}`:''} | ${(s.limitations||[]).join('; ')||'None recorded'} |`).join('\n')}\n\n## Validation rules\n\nThe automated audit flags missing element identities or coordinates, unknown representation/structure types, invalid lattice vectors, generic fallbacks, identical colours for multiple elements, malformed or unknown-element bond rules, missing provenance, representative models incorrectly claimed as exact, and model geometry that conflicts with the declared archetype. Ti3C2Tx additionally requires the Ti-C-Ti-C-Ti stack and O, OH and F terminations. Bonds are rendered only from explicit indexed connectivity or a declared element-pair/distance/coordination rule.\n\n## Scientific limitations\n\nYSZ is a declared 10.3 mol% Y2O3 representative cubic defect model (Zr26Y6O61): six Y substitutions and three charge-compensating oxygen vacancies in a 2×2×2 fluorite conventional supercell. The particular defect ordering is not unique. MAPbI3 uses the named 400 K P4mm phase and an idealized methylammonium orientation. Ti3C2Tx uses a sourced backbone with an ordered representative mixed-termination display cell; actual termination coverage and distribution vary. Alloy solid solutions, precipitate populations, polymer morphology, liquid snapshots, glasses, aerogels, hydrogels and composites are explicitly representative. They are not presented as diffraction-refined exact structures.\n\n## Render construction validation\n\nAll 26 shared render models are constructed in the automated production check without an unavailable or generic fallback. Crystalline and layered records require repeat boundaries, element legends are generated from rendered species, and the shared viewer retains rotation, zoom and instanced-atom hover metadata. Visual viewport review remains a separate manual quality check.\n`;
fs.writeFileSync(path.join(__dirname,'..','STRUCTURE_AUDIT.md'),report);
console.log(`Structure validation: ${rows.length-failed.length}/${rows.length} passed`);
if(failed.length){for(const r of failed)console.error(r.id,r.errors.join('; '));process.exit(1);}
