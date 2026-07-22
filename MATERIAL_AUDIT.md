# MATERIDEX material audit

Generated 2026-07-22. This inventory checks every current material entry, its visible metadata, structure representation, specimen archetype and key property records. Code-generated specimens do not require separate image assets. TODO items mark scientific work that needs a named composition, grade or source rather than an invented value.

## Summary

* Materials audited: 26
* Implementation errors: 0
* Scientific limitations and TODO items: 28
* Missing material-specific image assets: 0; material structures and specimens are rendered from shared data and code
* Generic white-ball fallbacks: 0

| ID | Displayed material | Formula | Category | Structure visual | Specimen | Properties | Result | Scientific limitation or TODO |
|---|---|---|---|---|---|---:|---|---|
| graphene | Graphene | C (sp²) | 2D Materials | Hexagonal layered; crystallographic | veil | 7 | PASS | model limitation: Ideal defect-free monolayer. |
| cnt | Carbon Nanotube | C (sp²) | Carbon Forms | Hexagonal layered; representative | tube | 4 | PASS | model limitation: One representative chirality. |
| diamond | Diamond | C (sp³) | Carbon Forms | Diamond cubic; crystallographic | gem | 4 | PASS | No additional limitation recorded |
| aerogel | Silica Aerogel | SiO₂ (porous) | Ceramics & Glasses | Amorphous network; representative | smoke | 4 | PASS | model limitation: Pore topology depends on synthesis. |
| mxene | MXene (Ti₃C₂Tₓ) | Ti₃C₂Tₓ | 2D Materials | Hexagonal layered Ti₃C₂Tₓ; representative | layers | 3 | PASS | model limitation: Termination identity, coverage and ordering vary with synthesis and environment. |
| pedot | PEDOT:PSS | (C₆H₄O₂S)ₙ·PSS | Polymers | Polymer repeat unit; representative | web | 3 | PASS | model limitation: Doping and domain morphology vary. |
| liquidmetal | Liquid Metal (EGaIn) | Ga–In eutectic | Smart Materials | Representative liquid snapshot; representative | blob | 3 | PASS | replace tensile surrogate with an encapsulated-channel electrical continuity model; model limitation: Liquid coordination is time-dependent. |
| silicon | Silicon | Si | Semiconductors | Diamond cubic; crystallographic | ingot | 4 | PASS | No additional limitation recorded |
| gaas | Gallium Arsenide | GaAs | Semiconductors | Zinc blende; crystallographic | ingot | 3 | PASS | No additional limitation recorded |
| perovskite | Halide Perovskite (MAPbI₃ model) | CH₃NH₃PbI₃ shown | Energy Crystals | Perovskite; crystallographic | gem | 3 | PASS | verify family-wide performance values separately from the displayed MAPbI3 phase; model limitation: Not the room-temperature tetragonal phase; H atoms omitted. |
| sic | Silicon Carbide | SiC | Ceramics & Glasses | Zinc blende; crystallographic | shard | 4 | PASS | add a 4H-SiC structure if the power-electronics property set remains 4H-specific; model limitation: Other SiC polytypes are not shown. |
| alumina | Alumina | Al₂O₃ | Ceramics & Glasses | Corundum; crystallographic | shard | 4 | PASS | No additional limitation recorded |
| zirconia | Zirconia (YSZ) | ZrO₂ (Y-stabilised) | Ceramics & Glasses | Fluorite; crystallographic | shard | 3 | PASS | separate 3Y-TZP mechanical and high-yttria cubic conductor grades into distinct future records; model limitation: Defect distribution is one declared configuration. |
| glass | Soda-Lime Glass | SiO₂·Na₂O·CaO | Ceramics & Glasses | Amorphous network; representative | pane | 4 | PASS | model limitation: Not a composition-specific molecular-dynamics cell. |
| ti64 | Ti-6Al-4V | Ti-6Al-4V | Metals & Alloys | Composite microstructure; representative | lattice3d | 4 | PASS | model limitation: Phase fraction depends on thermomechanical history. |
| nitinol | Nitinol | NiTi (~50:50 at%) | Smart Materials | B2 cubic; crystallographic | ribbon | 4 | PASS | model limitation: Transformation texture and off-stoichiometry are not represented. |
| steel | Stainless Steel 316L | Fe-Cr-Ni-Mo | Metals & Alloys | FCC; representative | lattice3d | 3 | PASS | model limitation: Not a special-quasirandom structure or grain-resolved alloy. |
| alli | Al-Li Alloy 2195 | Al-Cu-Li | Metals & Alloys | Composite microstructure; representative | lattice3d | 3 | PASS | model limitation: No unique precipitate population exists. |
| cfrp | Carbon Fibre Composite | C fibre / epoxy | Composites | Composite microstructure; representative | weave | 4 | PASS | model limitation: Layup and fibre volume fraction are representative. |
| kevlar | Kevlar 49 | Aramid (PPTA) | Polymers | Polymer repeat unit; representative | weave | 3 | PASS | model limitation: Radial pleating and disorder are simplified. |
| pla | PLA | (C₃H₄O₂)ₙ | Polymers | Polymer repeat unit; representative | coil | 3 | PASS | model limitation: Crystallinity is processing-dependent. |
| peek | PEEK | (C₁₉H₁₂O₃)ₙ | Polymers | Polymer repeat unit; representative | coil | 3 | PASS | model limitation: Hydrogens implicit; lamellar dimensions schematic. |
| silicone | Silicone (PDMS) | (C₂H₆OSi)ₙ | Polymers | Polymer repeat unit; representative | membrane | 3 | PASS | model limitation: Crosslink chemistry and density vary. |
| hydrogel | Hydrogel (PVA/alginate) | Polymer + H₂O | Nano Biostructures | Polymer repeat unit; representative | membrane | 3 | PASS | declare a specific polymer formulation before presenting formulation-specific properties; model limitation: Polymer identity and swelling ratio are formulation-specific. |
| cellulose | Cellulose Nanofibre | (C₆H₁₀O₅)ₙ | Nano Biostructures | Polymer repeat unit; representative | bloom | 3 | PASS | model limitation: Full hydrogen-bond geometry is not resolved. |
| mycelium | Mycelium Composite | Fungal hyphae + substrate | Nano Biostructures | Composite microstructure; representative | reef | 3 | PASS | declare species, substrate and density before presenting design values; model limitation: Species, substrate and growth conditions change morphology. |

## Audit boundaries

The audit verifies completeness and internal consistency in the repository. It does not certify property values as engineering allowables. Ranges can depend strongly on grade, orientation, processing, porosity, temperature and test method. The shared structure audit provides structure provenance and modelling assumptions in more detail.
