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
- **Authoring YAML** – Writing semantic overlays
- **Validation** – SHACL, ValidationOverlay, and constraints
- **Transformation** – jq, JOLT, and common transformation patterns
- **Forms** – Form concepts and rendering
- **Repository Usage** – Publishing, retrieving, and versioning overlays
- **FAQ** – Common questions and pitfalls

→ See [`docs/users/`](users/overview.md)

---

### 🧑‍💻 Developers

If you want to **extend, integrate, or embed SOyA** into applications or
services, this section explains the internal architecture and APIs:

- **Architecture** – Components and responsibilities
- **soya-js Library** – API usage and integration
- **CLI** – Commands, configuration, and examples
- **Repository Service** – API, Docker setup, deployment
- **Data Models** – DRI, versioning, and SemVer policy
- **Contribution Guide** – Development setup, testing, release flow
- **Security** – Supply chain, signing, and integrity (optional)

→ See [`docs/developers/`](developers/architecture.md)

---

### 🛠 Maintainers

If you are responsible for **releases, documentation consistency, or
governance**, these documents define the rules and processes:

- **Documentation Playbook** – Structure, sources of truth, conventions
- **Release Process** – Versioning, changelogs, and publication

→ See [`docs/maintainers/`](maintainers/documentation-playbook.md)

---

## Examples and Academic Publications

- **Examples**  
  Minimal and advanced SOyA overlays and configurations are available under
  [`examples/`](examples/).
- **Use Cases**. 
  Documented use cases illustrate how SOyA is applied in concrete domains and
  project contexts, highlighting typical integration patterns and adoption
  scenarios: [`use-cases/`](use-cases/).
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
