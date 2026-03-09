# Authoring YAML

## Overview

In SOyA (Semantic Overlay Architecture), semantic structures are
ultimately represented and stored as **JSON-LD**. JSON-LD provides the
full expressive power required for ontology development, linked data
integration, and semantic interoperability across systems.

However, authoring JSON-LD directly can be verbose and difficult to
read. For this reason, SOyA introduces **YAML as a human-friendly
authoring format** for defining SOyA structures.

YAML allows developers, domain experts, and data modelers to describe
semantic data structures in a **compact, readable, and maintainable
format**, while still enabling the full semantic capabilities of JSON-LD
in the underlying system.

It is important to note that:

-   **YAML is only an authoring convenience layer.**
-   **JSON-LD is the canonical representation used internally by SOyA.**
-   **All SOyA structures are ultimately stored in the repository as
    JSON-LD.**

The authoring workflow therefore always involves a **conversion step
from YAML to JSON-LD**.

This design follows the approach introduced in the original SOyA
tutorial for describing data models in YAML, where YAML is used as an
approachable modelling language while JSON-LD provides the semantic
backbone.

------------------------------------------------------------------------

## Why YAML for Authoring?

The SOyA project chose YAML as the preferred authoring format for
several reasons:

-   **Human readability:** YAML is easier to read and write than raw
    JSON-LD.
-   **Reduced verbosity:** The syntax avoids many of the structural
    elements required in JSON-LD.
-   **Developer familiarity:** YAML is widely used in configuration
    systems (e.g., Kubernetes, GitHub Actions).
-   **Structured editing:** YAML allows data structures to be expressed
    clearly with minimal syntactic overhead.

YAML therefore works well for describing:

-   SOyA **structures**
-   semantic **data models**
-   domain-specific **data schemas**
-   semantic **overlays** on existing datasets

Nevertheless, advanced semantic modeling capabilities --- such as
complex context definitions, linked data constructs, or advanced
ontology features --- remain available only in **JSON-LD**.

------------------------------------------------------------------------

## Authoring Options

There are two primary ways to create SOyA structures using YAML.

### 1. Authoring YAML in Text Files (CLI Workflow)

Developers can write YAML files locally using any text editor. This
workflow follows the approach described in the original SOyA tutorial
for describing data models in YAML.

Typical workflow:

1.  Create a YAML file describing the SOyA structure.
2.  Convert the YAML into JSON-LD using the SOyA CLI.
3.  Push the resulting JSON-LD structure to the SOyA repository.

The SOyA command line tool provides three important commands for this
workflow.

#### `soya init`

Converts a YAML definition into its JSON-LD representation.

Example:

    cat structure.yaml | soya init > structure.jsonld

This command performs the semantic conversion and produces the JSON-LD
structure used internally by SOyA.

#### `soya push`

Uploads a JSON-LD structure to the SOyA repository.

Example:

    cat structure.jsonld | soya push

The structure becomes available in the SOyA repository and can be used in applications.

#### `soya init-push`

Combines the previous two commands in a single step.

    cat structure.yaml | soya init-push

This command:

1.  converts the YAML file to JSON-LD
2.  pushes the structure to the repository
3.  ensures that the **human-readable YAML file is stored alongside the
    JSON-LD structure**

This approach allows developers to keep both:

-   a **developer-friendly YAML definition**
-   the **canonical JSON-LD structure used by SOyA**

in the repository.

This CLI workflow is particularly useful for:

-   version-controlled repositories
-   automated pipelines
-   collaborative ontology development
-   integration into CI/CD environments

------------------------------------------------------------------------

### 2. Using the SOyA Web Interface

Alternatively, SOyA structures can be authored using the web interface:

https://soya.ownyourdata.eu

The web interface provides a user-friendly environment for:

-   creating SOyA structures
-   editing YAML definitions
-   validating structures
-   publishing them to the repository

When using the WebUI, the **conversion from YAML to JSON-LD happens
automatically when saving a structure**.

Users can also switch the editor view between:

-   **YAML view** (human-friendly editing)
-   **JSON-LD view** (canonical representation)

This makes it easy to both understand the data model and inspect the
underlying semantic representation.

The WebUI is particularly useful for:

-   first-time users
-   domain experts without programming experience
-   rapid experimentation with structures

------------------------------------------------------------------------

## The YAML → JSON-LD Conversion Process

Regardless of how a structure is authored, the **same internal process
applies**.

1.  A SOyA structure is defined in **YAML**.
2.  The YAML definition is **converted into JSON-LD**.
3.  The resulting JSON-LD document becomes the **canonical structure
    stored in the SOyA repository**.

Conceptually, the workflow looks like this:

    YAML (authoring)
          ↓
    SOyA conversion process
          ↓
    JSON-LD (machine-readable representation)
          ↓
    SOyA Repository

This approach separates:

-   **human-friendly authoring**
-   **machine-readable semantic representation**

while ensuring compatibility with the **Linked Data ecosystem**.

------------------------------------------------------------------------

## Relationship to Ontologies and Linked Data

SOyA structures build upon established semantic web standards,
including:

-   **JSON-LD**
-   **Linked Data principles**
-   **semantic ontologies and vocabularies**

While YAML simplifies authoring, the underlying JSON-LD representation
allows SOyA structures to integrate with:

-   semantic data spaces
-   knowledge graphs
-   ontology-based data integration
-   linked data infrastructures

This ensures that SOyA can act as a **lightweight overlay layer** on top
of existing semantic technologies while maintaining interoperability
with broader data ecosystems.

------------------------------------------------------------------------

## Summary

YAML serves as a **practical authoring format** for defining SOyA
structures, enabling developers and domain experts to work with semantic
data models in a clear and concise way.

The key principles are:

-   YAML is used for **human-friendly authoring**
-   JSON-LD provides the **full semantic functionality**
-   All structures are **stored internally as JSON-LD**
-   A **conversion step from YAML to JSON-LD** is always part of the
    workflow

Users can author structures either:

-   locally using the **SOyA CLI tool**, or
-   through the **SOyA WebUI**.

The CLI provides dedicated commands (`soya init`, `soya push`,
`soya init-push`) to manage the conversion and publication workflow,
while the WebUI performs the same process automatically during editing
and saving.

---

## What to do next

After learning how to author SOyA structures in YAML, the next steps are
to explore how these structures are used within the SOyA ecosystem.

→ Continue with [`Validation`](validation.md) or go back to the [`Overview`](../README.md)