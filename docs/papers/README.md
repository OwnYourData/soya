# Academic Publications and Background Material

This page collects **scientific publications, white papers, and project
references** related to **SOyA – Semantic Overlay Architecture**.

SOyA has been developed and refined across several research and innovation
projects. The materials below document its conceptual foundations, design
decisions, and the contexts in which it has been applied and evaluated.

---

## White Paper

The original white paper introduces SOyA, its motivation, definitions, and
the initial component architecture. It remains a useful entry point for
understanding the architectural intent behind the current implementation.

- **Title:** SOyA – Semantic Overlay Architecture (White Paper)
- **Authors:** Fajar J. Ekaputra, Christoph Fabianek, Gabriel Unterholzer
- **Status:** Draft, November 22nd, 2021
- **File:** [`SOyA_WhitePaper_Nov21.pdf`](SOyA_WhitePaper_Nov21.pdf)

---

## Peer-Reviewed Publications

### The Semantic Overlay Architecture for Data Interoperability and Exchange (2023)

The first peer-reviewed conference paper on SOyA, presented at the **IEEE
International Conference on Data and Software Engineering (ICoDSE) 2023**.
It positions SOyA as a lightweight, RDF-centric approach to data
interoperability and exchange and reports on a preliminary evaluation
focused on roles within knowledge graph engineering.

- **Authors:** Fajar J. Ekaputra, Christoph Fabianek, Gabriel Unterholzer, Eduard Gringinger
- **Venue:** 2023 IEEE International Conference on Data and Software Engineering (ICoDSE), Toba, North Sumatera, Indonesia, 7–8 September 2023, pp. 232–237
- **Publisher:** IEEE
- **File:** [`2023_SOyA_ICoDSE_IEEE`](2023_SOyA_ICoDSE_IEEE.pdf)
- **DOI:** [10.1109/ICoDSE59534.2023.10291689](https://doi.org/10.1109/ICoDSE59534.2023.10291689)

BibTeX:

```bibtex
@inproceedings{Ekaputra2023SOyA,
  author    = {Ekaputra, Fajar J. and Fabianek, Christoph and Unterholzer, Gabriel and Gringinger, Eduard},
  title     = {The Semantic Overlay Architecture for Data Interoperability and Exchange},
  booktitle = {2023 IEEE International Conference on Data and Software Engineering (ICoDSE)},
  pages     = {232--237},
  year      = {2023},
  publisher = {IEEE},
  doi       = {10.1109/ICoDSE59534.2023.10291689}
}
```

### A Configurable Anonymisation Service for Semantically Annotated Data: A Case Study on REC Data (2025)

A workshop paper presented at the **NeXt-generation Data Governance
workshop 2025** in Vienna. It extends SOyA with a configurable, rule-based
anonymisation service for semantically annotated data and demonstrates the
approach in the context of **Renewable Energy Communities (RECs)**. The paper
illustrates how SOyA overlays can be used to declare anonymisation
requirements (generalisation, randomisation) and enforce them through an
automated pipeline aligned with GDPR and the EU Data Governance Act.

- **Authors:** Paul Feichtenschlager, Christoph Fabianek, Fajar J. Ekaputra, Sebastian Haas, Gabriel Unterholzer
- **Venue:** NeXt-generation Data Governance Workshop 2025, Vienna, Austria, 3 September 2025
- **License:** CC BY 4.0
- **File:** [`2025_SOyA_AnonymisationService.pdf`](2025_SOyA_AnonymisationService.pdf)

BibTeX:

```bibtex
@inproceedings{Feichtenschlager2025SOyA,
  author    = {Feichtenschlager, Paul and Fabianek, Christoph and Ekaputra, Fajar J. and Haas, Sebastian and Unterholzer, Gabriel},
  title     = {A Configurable Anonymisation Service for Semantically Annotated Data: A Case Study on REC Data},
  booktitle = {NeXt-generation Data Governance Workshop 2025},
  address   = {Vienna, Austria},
  year      = {2025}
}
```

---

## Research and Innovation Projects

SOyA has been developed and applied in several publicly-funded research and
innovation projects. These provide the application contexts and evaluation
environments in which the architecture has been validated.

### IDunion

The functionality that became SOyA was originally implemented to manage
different data models of COVID-19 credentials within the FFG-funded
**IDunion** project.

### ONTOCHAIN – Babelfish

The **Babelfish** sub-project, funded under the EU Horizon 2020 **NGI
ONTOCHAIN** programme (cascade funding agreement No. 957338), used SOyA as
a core building block for data harmonisation, alongside Semantic Containers
and Data Agreements.

### TRUSTCHAIN

Further development of SOyA continued under the EU **NGI TRUSTCHAIN**
programme (cascade funding agreement No. 101093274).

### PACE-DPP

In the **PACE-DPP** project, SOyA contributes to the semantic annotation of
data structures in the emerging **Digital Product Passport (DPP)** ecosystem,
together with self-sovereign identity and data governance components.

---

## How to Cite SOyA

For academic work, the recommended citation is the **ICoDSE 2023 paper**
listed above. The white paper may be referenced in addition when
architectural background or design intent is relevant. Application-specific
extensions (e.g., the anonymisation service) should be cited separately
where appropriate.

---

## Adding New Material

This collection is intended to grow as SOyA is applied and evaluated in
further contexts. Suggested additions—publications, technical reports,
theses, or use-case write-ups—are welcome via the documentation
contribution process described in the
[`maintainers`](../maintainers/documentation.md) section.

---

→ Go back to the [`Overview`](../README.md)
