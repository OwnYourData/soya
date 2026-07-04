# SOyA Documentation

Welcome to the documentation of **SOyA – Semantic Overlay Architecture**.

SOyA is a modular architecture and tooling ecosystem for describing,
validating, transforming, and publishing **semantic overlays** on top of
existing data models using lightweight, declarative specifications
(primarily YAML).

This documentation is structured to support **users**, **developers**, and
**maintainers**, depending on how you interact with SOyA.

---

## What is SOyA?

SOyA (Semantic Overlay Architecture) provides a structured way to:

- describe **semantic constraints and extensions** over existing data models
- validate data against those constraints (e.g. via SHACL)
- transform data between representations (e.g. using jq or handlebars)
- define **forms and user-facing representations** derived from semantic models
- publish and version these specifications in a reusable repository

SOyA is intentionally **technology-agnostic** with respect to domains and
data spaces. It has been applied in contexts such as data spaces, digital
product passports, verifiable credentials, and research infrastructures.

---

## Documentation Overview

### 👤 Users

If you want to **use SOyA specifications** to describe data, validate inputs,
or build forms and transformations, start here:

- [**Overview**](users/overview.md) – What SOyA is and when to use it
- [**Getting Started**](users/getting-started.md) – Available infrastructure and first steps
- [**Authoring YAML**](users/authoring-yaml.md) – Writing semantic overlays
- [**Validation**](users/validation.md) – SHACL, ValidationOverlay, and constraints
- [**Transformation**](users/transformation.md) – jq, handlebars, and common transformation patterns
- [**Forms**](users/forms.md) – Form concepts, rendering, and the SOyA-Form web tool
- [**Repository Usage**](users/repository.md) – Publishing, retrieving, and versioning SOyA structures
- [**FAQ**](users/faq.md) – Common questions and pitfalls

→ See [`docs/users/`](users/overview.md)

---

### 🧑‍💻 Developers

If you want to **extend, integrate, or embed SOyA** into applications or
services, this section explains the internal architecture and APIs:

- [**Architecture**](developers/architecture.md) – Components and responsibilities
- [**soya-js Library**](developers/soya-js.md) – API usage and integration
- [**CLI**](developers/cli.md) – Commands, testing, and examples
- [**Node 24 Migration**](developers/migration-node24.md) – Migration of the JS/TS stack from Node 16 to Node 24 (lib2/cli2)

→ See [`docs/developers/`](developers/architecture.md)

---

### 🛠 Maintainers

If you are responsible for **releases, documentation consistency, or
governance**, these documents define the rules and processes:

- [**Deployment**](maintainers/deployment.md) - How to configure and operate a SOyA environment
- [**User Management**](maintainers/user-management.md) – Users, organizations, and OAuth credentials of a repository
- [**Documentation Playbook**](maintainers/documentation.md) – Structure, sources of truth, conventions
- [**Release Process**](maintainers/releases.md) – Versioning, changelogs, and publication

→ See [`docs/maintainers/`](maintainers/deployment.md)

---

## Examples and Academic Publications

- **Examples**  
  Minimal and advanced SOyA overlays and configurations are available under
  [`examples/`](examples/). A guided tour is provided in the
  [tutorial](../tutorial/README.md).
- **Academic Publications**  
  SOyA has been developed and evaluated in several research and innovation
  projects. Relevant publications and background material are collected in
  [`papers/`](papers/).

---

## Status and Maturity

SOyA is an evolving architecture developed and refined across multiple
research and innovation projects. Individual components may differ in
maturity, but the core concepts (semantic overlays, validation, and
transformation) are stable and in active use.

---

## Getting Help and Contributing

- Questions and issues: GitHub Issues in the main repository
- Contributions: See the contribution guide for maintainers above

We welcome feedback, clarifications, and improvements—especially where SOyA
is applied in new domains.
