# MATERIDEX

*MATERIDEX is an interactive materials science universe for discovering, examining, testing, comparing and collecting materials through a visual browser experience.*

**Live demo:** [https://youufan.github.io/MATERIDEX/](https://youufan.github.io/MATERIDEX/)

## Overview

MATERIDEX combines a scientific material codex with a navigable universe. Its current database contains 26 materials distributed across six thematic regions, spanning carbon forms, metals, ceramics, semiconductors, polymers, composites and biofabricated systems. Each material connects descriptive data, properties, applications and related materials with an interactive structural representation.

The experience is designed for open exploration. Users can move freely between the Material Index, World Atlas, Codex, Laboratory, Compare, Collection, Challenges and Expeditions. Optional expeditions provide direction and rewards without restricting access to the core tools.

## Explore MATERIDEX

![The MATERIDEX World Atlas showing its interactive material realms](assets/readme/world_atlas.png)

*The World Atlas presents material families as an explorable constellation of distinct realms.*

![The graphene codex entry showing its hexagonal atomic structure and properties](assets/readme/graphene_codex.png)

*The Material Codex combines an interactive scientific structure with properties, provenance and progression.*

## Main features

1. **Material Codex** presents identity, bonding, structure, synthesis, properties, applications, related materials and source information for every included material.

2. **Scientific structure viewer** renders crystallographic structures and clearly declared representative models with element colours, legends, unit cells, provenance and modelling notes. Structure data is checked by the included validation script.

3. **Material Index** provides constellation based exploration, text search, filters, saved searches, recent materials and property based comparison views.

4. **World Atlas** organises the material database into six interactive regions with distinct environments, hazards and material families.

5. **Laboratory** supports interactive tensile experiments with material selection, temperature, defect density, layer count, grain orientation and strain rate controls. Every result is labelled as an educational model and can be saved for later review.

6. **Compare and Loadout** combines radar and tabular property comparisons with an airframe material assignment exercise, compatibility checks and predicted outcomes.

7. **Challenges** contains ten design scenarios covering tradeoffs in sensing, marine structures, energy storage, thermal protection, actuation, packaging and related applications. Later scenarios become available through progression.

8. **Expeditions** provide optional guided investigations. The current Perovskite Stability Problem explores moisture, heat and light degradation in methylammonium lead iodide and cites its scientific sources inside the experience.

9. **Collection and progression** records discoveries, duplicate specimens, family sets, mastery, achievements, research history and saved configurations. Progress is stored locally in the browser and can be exported or imported.

10. **Cinematic presentation** uses interactive three dimensional scenes, Canvas graphics, synthesised sound, responsive controls and reduced motion settings.

## Material exploration flow

1. Enter a region through the World Atlas or search the Material Index.

2. Open a material entry and inspect its scientific summary, structure, properties, applications and related materials.

3. Discover the material to add it to the Collection and advance its mastery record.

4. Test suitable materials in the Laboratory, compare property signatures or assign them to a loadout.

5. Apply the resulting understanding in Challenges or follow an optional Expedition.

6. Continue exploring freely while relevant expedition objectives are recognised in the background.

## Technology

MATERIDEX is a static browser application built with semantic HTML, custom CSS and plain JavaScript. Three.js provides WebGL rendering for structures, specimens, the atlas and cinematic scenes. Canvas provides constellation graphics, charts and scientific schematics. The Web Audio API generates interface sound, while browser local storage preserves progress and settings. Material structures and Collection specimens are generated from repository data and code rather than downloaded model assets.

The repository vendors the Three.js runtime and post processing modules required by the application. Node.js is used only for repository validation and the production integrity check. No package installation or build bundler is required to run the site.

## Running locally

Clone the repository and enter its directory.

```text
git clone https://github.com/Youufan/MATERIDEX.git
cd MATERIDEX
```

Start a local static server from the repository root, then open [http://localhost:4173](http://localhost:4173).

```text
python3 -m http.server 4173
```

Opening `index.html` directly also works in current browsers, but a local server gives behaviour closer to GitHub Pages and makes missing asset requests easier to diagnose.

Run the complete production audit and build check with:

```text
npm run build
```

Run the automated checks without the generated audit step with:

```text
npm test
```

No package installation or bundling step is required. Node.js is used only to run repository checks.

## Building and deployment

`npm run build` is the production gate. It validates all material and structure records, constructs every render model, exercises the first mission, checks both shared viewer lifecycles, renders the Laboratory state matrix and verifies referenced local assets.

The site is deployed as static files. For the existing GitHub Pages setup, keep Pages configured to serve the repository root from `main`, run the build locally, then push the reviewed files to `main`. No generated distribution folder is required.

## Repository structure

```text
MATERIDEX/
├── index.html                 Application shell and screen markup
├── css/                       Visual system and screen specific styles
├── js/
│   ├── data.js               Material, region, challenge and achievement data
│   ├── structure-data.js     Shared scientific structure records
│   ├── structures.js         Structure rendering and validation logic
│   ├── codex.js              Material entry and structure interactions
│   ├── first-mission.js       Guided first engineering decision
│   ├── gfx.js                 Shared Three.js stage and material helpers
│   ├── constellation.js      Material Index exploration
│   ├── atlas.js              World Atlas rendering and interaction
│   ├── lab.js                Laboratory simulation
│   ├── loadout.js            Comparison and material loadout tools
│   ├── challenges.js         Engineering challenge scenarios
│   ├── expedition.js         Guided perovskite investigation
│   ├── collection.js         Collection and specimen views
│   ├── quests.js             Optional expedition and passive progression logic
│   ├── onboard.js            Cinematic introduction
│   └── core.js               Shared state, navigation and utilities
├── vendor/                    Vendored Three.js and post processing modules
├── scripts/                   Structure validation and production checks
├── MATERIAL_AUDIT.md          Complete material inventory and open TODO items
├── STRUCTURE_AUDIT.md         Material structure audit and limitations
└── package.json               Validation commands
```

## Project status

MATERIDEX is an active browser based project with its complete interactive experience available from the main branch and GitHub Pages. The current production gate audits all 26 material entries and structures, constructs every shared render model, checks all 12 main screens, exercises mission persistence and validates responsive viewer states. Known scientific representation limits and modelling assumptions are documented in `MATERIAL_AUDIT.md`, `STRUCTURE_AUDIT.md` and the individual material entries.

## Known limitations

1. Alloy, glass, polymer, liquid, hydrogel, composite and biological visuals are declared representative models because those materials do not have one unique atomic structure.

2. The Laboratory is a qualitative educational tensile model. It does not reproduce a complete constitutive law, processing history, defect population or certified design allowable.

3. The EGaIn Laboratory protocol remains a clearly labelled continuity surrogate. A future scientifically specific model should represent an encapsulated liquid channel rather than free standing tensile fracture.

4. The current SiC viewer shows 3C SiC while the explicitly labelled power electronics bandgap belongs to 4H SiC. The YSZ entry likewise separates its displayed high yttria cubic defect model from 3Y TZP mechanical values.

5. Progress is stored in the current browser. Export and import are available, but there is no remote account synchronisation.

## Test procedure

1. Run `npm run build` and confirm that the material audit, structure audit, render construction, mission, Laboratory, Collection, Codex and static production checks pass.

2. Serve the repository locally and visit every main destination through the navigation rail.

3. Check the browser console for errors or WebGL warnings.

4. Review the layouts at 1920 by 1080, 1440 by 900, 1280 by 720, 1024 by 768, 768 by 1024 and 390 by 844.

5. Switch structures and Collection specimens repeatedly, resize the viewer and navigate away and back to confirm that one canvas and one animation loop remain active.

## Reliability work completed

This audit introduced complete material and structure inventories, explicit phase and composition distinctions for MAPbI₃, SiC and YSZ, simulation scope disclosures, a recognisable PEDOT:PSS specimen glyph and a noncrystalline EGaIn Laboratory visual. The Codex and Collection viewers now preserve one renderer and canvas, reject stale replacement requests, dispose only replaced models, recover from WebGL context loss and show loading or retry states. Responsive navigation now keeps every existing destination reachable on tablet and phone widths. The build also checks routes, major controls, local assets, mission persistence and shared viewer ownership.

## Educational scope

Material values, structural models and simulations are intended for interactive education and exploration. They are simplified where necessary and should not be used as the basis for professional engineering, safety, manufacturing or material selection decisions.
