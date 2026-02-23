# SOyA Overview

This document provides a high-level introduction to **SOyA – Semantic Overlay
Architecture** from a user perspective. It explains what SOyA is, which
problems it addresses, and when it is an appropriate solution.

---

## What Problem Does SOyA Solve?

In many systems, data structures already exist:

- JSON or JSON-LD documents
- APIs with fixed schemas
- domain-specific information models
- exchanged data that cannot easily be changed at the source

However, projects often need to **add semantics on top of existing data**:

- additional constraints or quality rules
- domain- or use-case-specific interpretations
- derived fields or transformed representations
- user-facing forms and validation logic

SOyA addresses this by allowing semantics to be **described externally**, without
modifying the original data model or implementation.

---

## Core Idea: Semantic Overlays

At the heart of SOyA is the concept of a **semantic overlay**.

A semantic overlay is a declarative description that:

- references an existing data structure
- adds constraints, rules, or interpretations
- defines transformations or derived views
- can be versioned, reused, and combined

Overlays are typically written in **YAML** and can be processed by SOyA tools
for validation, transformation, and form generation.

Importantly, overlays do **not replace** the underlying data model—they
*overlay* it.

---

## What SOyA Is (and Is Not)

### SOyA is:

- a way to describe **semantics on top of existing data**
- modular and composable
- suitable for iterative and evolving requirements
- compatible with validation and transformation technologies

### SOyA is not:

- a replacement for JSON Schema, SHACL, or domain standards
- a single monolithic data model
- tied to a specific industry or data space
- a runtime data store or database

SOyA complements existing standards and tooling rather than competing with
them.

---

## Typical Use Cases

SOyA is particularly useful when:

- multiple stakeholders share data but require different interpretations
- data models are stable, but semantics evolve over time
- validation rules differ by context, role, or jurisdiction
- forms and user interfaces should be derived from semantic definitions
- data must be transformed between technical and domain representations

Common application areas include data spaces, digital product information,
verifiable credentials, and research infrastructures.

---

## How SOyA Fits Into a Workflow

From a user perspective, a typical SOyA workflow looks like this:

1. Identify an existing data structure or exchange format
2. Define one or more semantic overlays in YAML
3. Validate data against the overlay constraints
4. Apply transformations or derive views as needed
5. Reuse or publish overlays via a repository

Each step can be adopted independently; SOyA does not require a full
end-to-end setup.

---

## When Should I Use SOyA?

Use SOyA if:

- you cannot (or should not) change the original data model
- semantics vary by use case, profile, or version
- you need transparent, auditable rules
- non-developers should be able to review semantic definitions

You may not need SOyA if:

- a single, static schema fully captures all requirements
- semantics are hard-coded and unlikely to change
- no validation or transformation is required

---

## Next Steps

- **Getting Started**: Available services and first steps with SOyA
- **Authoring YAML**: How to write semantic overlays
- **Validation**: Applying constraints and quality rules
- **Transformation**: Mapping and deriving data representations

→ Continue with [`Getting Started`](getting-started.md) or go back to the [`Overview`](../README.md)