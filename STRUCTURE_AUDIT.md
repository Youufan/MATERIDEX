# MATERIDEX structure audit

Generated 2026-07-22. This report covers every material in the current database. “Crystallographic” means the displayed lattice and basis are sourced. “Representative” means the model communicates chemistry or morphology without claiming a unique exact atomic arrangement.

## Validation summary

- Materials audited: 26
- Passed: 26
- Failed: 0
- Generic white-sphere fallbacks: 0
- Multi-element records with a single element colour: 0

| Material ID | Representation | Structure label | Model status | Phase / composition represented | Source | Validation | Remaining limitations |
|---|---|---|---|---|---|---|---|
| graphene | layered structure | Hexagonal layered | Crystallographic | monolayer graphene; C | [Castro Neto et al., Rev. Mod. Phys. 81, 109 (2009), aCC = 1.42 Å](https://doi.org/10.1103/RevModPhys.81.109) | PASS | Ideal defect-free monolayer. |
| cnt | layered structure | Hexagonal layered | Representative | single-wall (10,0) zigzag nanotube; C | [Saito, Dresselhaus & Dresselhaus, Physical Properties of Carbon Nanotubes (1998)](https://doi.org/10.1142/p080) | PASS | One representative chirality. |
| diamond | crystal lattice | Diamond cubic | Crystallographic | cubic Fd-3m; C | [Materials Project mp-66, diamond C](https://optimade.materialsproject.org/v1/structures/mp-66) | PASS | None recorded |
| aerogel | atomic network | Amorphous network | Representative | amorphous silica aerogel; SiO₂ skeleton + void | [Woignier et al., J. Sol-Gel Sci. Technol. 76, 521–532 (2015)](https://doi.org/10.1007/s10971-015-3799-7) | PASS | Pore topology depends on synthesis. |
| mxene | layered structure | Hexagonal layered Ti₃C₂Tₓ | Representative | Ti₃C₂Tₓ monolayer with representative mixed O, OH and F terminations; Ti₃C₂Tₓ; ordered display cell with O, OH and F on both surfaces | [Materials Project mp-1094034 Ti₃C₂ backbone; Hope et al., PCCP 18, 5099–5102 (2016), mixed F/O/OH terminations](https://doi.org/10.1039/C6CP00330C) | PASS | Termination identity, coverage and ordering vary with synthesis and environment. |
| pedot | polymer chain | Polymer repeat unit | Representative | PEDOT:PSS blend; PEDOT repeat unit + PSS domain | [Groenendaal et al., Adv. Mater. 12, 481–494 (2000)](https://doi.org/10.1002/(SICI)1521-4095(200004)12:7%3C481::AID-ADMA481%3E3.0.CO;2-C) | PASS | Doping and domain morphology vary. |
| liquidmetal | representative model | Representative liquid snapshot | Representative | eutectic Ga–In liquid near 298 K; Ga 75.5 wt%, In 24.5 wt% (EGaIn) | [Dickey, Adv. Mater. 29, 1606425 (2017)](https://doi.org/10.1002/adma.201606425) | PASS | Liquid coordination is time-dependent. |
| silicon | crystal lattice | Diamond cubic | Crystallographic | cubic Fd-3m; Si | [Materials Project mp-149, silicon](https://optimade.materialsproject.org/v1/structures/mp-149) | PASS | None recorded |
| gaas | crystal lattice | Zinc blende | Crystallographic | cubic F-43m; GaAs | [Materials Project mp-2534, GaAs](https://optimade.materialsproject.org/v1/structures/mp-2534) | PASS | None recorded |
| perovskite | crystal lattice | Perovskite | Crystallographic | high-temperature alpha MAPbI₃, P4mm, 400 K; CH₃NH₃PbI₃ | [Stoumpos et al., Inorg. Chem. 52, 9019–9038 (2013), 400 K P4mm](https://doi.org/10.1021/ic401215x) | PASS | Not the room-temperature tetragonal phase; H atoms omitted. |
| sic | crystal lattice | Zinc blende | Crystallographic | 3C-SiC, cubic F-43m; SiC | [Materials Project mp-8062, 3C-SiC](https://optimade.materialsproject.org/v1/structures/mp-8062) | PASS | Other SiC polytypes are not shown. |
| alumina | crystal lattice | Corundum | Crystallographic | alpha-Al₂O₃, R-3c; Al₂O₃ | [Materials Project mp-1143, alpha-Al2O3](https://optimade.materialsproject.org/v1/structures/mp-1143) | PASS | None recorded |
| zirconia | crystal lattice | Fluorite | Crystallographic | cubic yttria-stabilized zirconia; 10.3 mol% Y₂O₃ representative: Zr₂₆Y₆O₆₁ | [Materials Project mp-1565 cubic ZrO2 base; Zhang et al., AIP Advances 6, 095119 (2016), Y substitution and oxygen-vacancy compensation](https://doi.org/10.1063/1.4963202) | PASS | Defect distribution is one declared configuration. |
| glass | atomic network | Amorphous network | Representative | soda-lime silicate glass; representative Si–O network with Na/Ca modifiers | [Zachariasen, J. Am. Chem. Soc. 54, 3841–3851 (1932)](https://doi.org/10.1021/ja01349a006) | PASS | Not a composition-specific molecular-dynamics cell. |
| ti64 | representative microstructure | Composite microstructure | Representative | alpha hcp + beta bcc; Ti–6Al–4V representative two-phase field | [Materials Project mp-46 alpha-Ti and mp-73 beta-Ti](https://optimade.materialsproject.org/v1/structures/mp-46) | PASS | Phase fraction depends on thermomechanical history. |
| nitinol | crystal lattice | B2 cubic | Crystallographic | B2 austenite; equiatomic NiTi | [Materials Project mp-571, B2 NiTi](https://optimade.materialsproject.org/v1/structures/mp-571) | PASS | Transformation texture and off-stoichiometry are not represented. |
| steel | crystal lattice | FCC | Representative | gamma-Fe austenitic matrix; 316L representative Fe–Cr–Ni–Mo solid solution | [Materials Project mp-150 gamma-Fe matrix; ASTM A240 316L composition](https://www.astm.org/a0240_a0240m-24.html) | PASS | Not a special-quasirandom structure or grain-resolved alloy. |
| alli | representative microstructure | Composite microstructure | Representative | FCC Al matrix + T1 platelets; 2195 Al–Cu–Li representative | [Materials Project mp-134 FCC Al; Rioja & Liu, Metall. Mater. Trans. A 43 (2012)](https://optimade.materialsproject.org/v1/structures/mp-134) | PASS | No unique precipitate population exists. |
| cfrp | representative microstructure | Composite microstructure | Representative | 0/90 carbon-fibre/epoxy laminate; carbon fibres + epoxy matrix | [Gay, Composite Materials: Design and Applications, 3rd ed. (2014)](https://doi.org/10.1201/b17106) | PASS | Layup and fibre volume fraction are representative. |
| kevlar | polymer chain | Polymer repeat unit | Representative | aligned PPTA chains; [-CO-C6H4-CO-NH-C6H4-NH-]n | [Northolt, Eur. Polym. J. 10, 799–804 (1974)](https://doi.org/10.1016/0014-3057(74)90110-7) | PASS | Radial pleating and disorder are simplified. |
| pla | polymer chain | Polymer repeat unit | Representative | semicrystalline PLLA; [-CH(CH3)-CO-O-]n | [Garlotta, J. Polym. Environ. 9, 63–84 (2001)](https://doi.org/10.1023/A:1020200822435) | PASS | Crystallinity is processing-dependent. |
| peek | polymer chain | Polymer repeat unit | Representative | semicrystalline PEEK; [-C6H4-O-C6H4-O-C6H4-CO-]n | [Kurtz, PEEK Biomaterials Handbook (2012)](https://doi.org/10.1016/C2010-0-66010-6) | PASS | Hydrogens implicit; lamellar dimensions schematic. |
| silicone | polymer chain | Polymer repeat unit | Representative | crosslinked amorphous PDMS; [-Si(CH3)2-O-]n | [Mark, Polymer Data Handbook (1999)](https://doi.org/10.1093/oso/9780195107890.001.0001) | PASS | Crosslink chemistry and density vary. |
| hydrogel | representative model | Polymer repeat unit | Representative | water-swollen crosslinked network; representative polymer + H2O | [Wichterle & Lim, Nature 185, 117–118 (1960)](https://doi.org/10.1038/185117a0) | PASS | Polymer identity and swelling ratio are formulation-specific. |
| cellulose | polymer chain | Polymer repeat unit | Representative | cellulose I-beta nanofibril; (C6H10O5)n | [Nishiyama et al., J. Am. Chem. Soc. 124, 9074–9082 (2002)](https://doi.org/10.1021/ja0257319) | PASS | Full hydrogen-bond geometry is not resolved. |
| mycelium | representative microstructure | Composite microstructure | Representative | dried mycelium composite; chitin-rich hyphae + particulate substrate | [Jones et al., Materials & Design 187, 108397 (2020)](https://doi.org/10.1016/j.matdes.2019.108397) | PASS | Species, substrate and growth conditions change morphology. |

## Validation rules

The automated audit flags missing element identities or coordinates, unknown representation/structure types, invalid lattice vectors, generic fallbacks, identical colours for multiple elements, malformed or unknown-element bond rules, missing provenance, representative models incorrectly claimed as exact, and model geometry that conflicts with the declared archetype. Ti3C2Tx additionally requires the Ti-C-Ti-C-Ti stack and O, OH and F terminations. Bonds are rendered only from explicit indexed connectivity or a declared element-pair/distance/coordination rule.

## Scientific limitations

YSZ is a declared 10.3 mol% Y2O3 representative cubic defect model (Zr26Y6O61): six Y substitutions and three charge-compensating oxygen vacancies in a 2×2×2 fluorite conventional supercell. The particular defect ordering is not unique. MAPbI3 uses the named 400 K P4mm phase and an idealized methylammonium orientation. Ti3C2Tx uses a sourced backbone with an ordered representative mixed-termination display cell; actual termination coverage and distribution vary. Alloy solid solutions, precipitate populations, polymer morphology, liquid snapshots, glasses, aerogels, hydrogels and composites are explicitly representative. They are not presented as diffraction-refined exact structures.

## Render construction validation

All 26 shared render models are constructed in the automated production check without an unavailable or generic fallback. Crystalline and layered records require repeat boundaries, element legends are generated from rendered species, and the shared viewer retains rotation, zoom and instanced-atom hover metadata. Visual viewport review remains a separate manual quality check.
