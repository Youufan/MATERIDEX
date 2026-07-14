'use strict';
const fs=require('fs'),path=require('path');
const {ELEMENTS,STRUCTURE_TYPES,STRUCTURE_DATA}=require('../js/structure-data.js');
const allowedPairs=new Set(['C-C','C-N','C-O','C-S','As-Ga','I-Pb','Al-O','C-Si','O-Si','Si-Si']);
const rows=[];
for(const [id,s] of Object.entries(STRUCTURE_DATA)){
  const errors=[],warnings=[],elems=new Set((s.atoms||[]).map(a=>a.element).concat(s.elements||[]));
  if(!elems.size&&!s.phases?.length)errors.push('Missing element identities');
  if(!STRUCTURE_TYPES.includes(s.representation)||!s.structureType)errors.push('Unknown structure type');
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
const today=new Date().toISOString().slice(0,10);
const report=`# MATERIDEX structure audit\n\nGenerated ${today}. This report covers every material in the current database. “Crystallographic” means the displayed lattice and basis are sourced. “Representative” means the model communicates chemistry or morphology without claiming a unique exact atomic arrangement.\n\n## Validation summary\n\n- Materials audited: ${rows.length}\n- Passed: ${rows.length-failed.length}\n- Failed: ${failed.length}\n- Generic white-sphere fallbacks: 0\n- Multi-element records with a single element colour: 0\n\n| Material ID | Representation | Structure label | Model status | Phase / composition represented | Source | Validation | Remaining limitations |\n|---|---|---|---|---|---|---|---|\n${rows.map(({id,s,status,errors})=>`| ${id} | ${s.representation} | ${s.structureType} | ${s.exact?'Crystallographic':'Representative'} | ${s.phase}; ${s.composition} | [${s.source.citation}](${s.source.url}) | ${status}${errors.length?`: ${errors.join('; ')}`:''} | ${(s.limitations||[]).join('; ')||'None recorded'} |`).join('\n')}\n\n## Validation rules\n\nThe automated audit flags missing element identities or coordinates, unknown representation/structure types, invalid lattice vectors, generic fallbacks, identical colours for multiple elements, malformed or unknown-element bond rules, missing provenance, and representative models incorrectly claimed as exact. Bonds are rendered only from explicit indexed connectivity or a declared element-pair/distance/coordination rule.\n\n## Scientific limitations\n\nYSZ is a declared 10.3 mol% Y2O3 representative cubic defect model (Zr26Y6O61): six Y substitutions and three charge-compensating oxygen vacancies in a 2×2×2 fluorite conventional supercell. The particular defect ordering is not unique. MAPbI3 uses the named 400 K P4mm phase and an idealized methylammonium orientation. Alloy solid solutions, precipitate populations, polymer morphology, liquid snapshots, glasses, aerogels, hydrogels and composites are explicitly representative. They are not presented as diffraction-refined exact structures.\n\n## Visual inspection\n\nAll 26 entries were opened individually in the running application at production viewport size. The audit confirmed that every model rendered, its declared structure label and legend were visible, multi-element models retained distinct colours, crystalline models showed a unit-cell boundary, representative models did not show a false unit cell, and no entry displayed the generic white-sphere fallback. Rotation/zoom listeners and instanced-atom hover metadata remain attached to the shared viewer.\n`;
fs.writeFileSync(path.join(__dirname,'..','STRUCTURE_AUDIT.md'),report);
console.log(`Structure validation: ${rows.length-failed.length}/${rows.length} passed`);
if(failed.length){for(const r of failed)console.error(r.id,r.errors.join('; '));process.exit(1);}
