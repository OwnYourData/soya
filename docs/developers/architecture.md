# SOyA Architecture (Developer View)

This document describes the internal architecture of **SOyA – Semantic Overlay Architecture**
from a developer perspective. It explains the main components, their responsibilities,
and how they interact.

The goal is to enable developers to understand, extend, or embed SOyA without requiring
deep knowledge of a specific deployment or project context.

---

## Architectural Principles

SOyA follows a set of core architectural principles:

- **Separation of concerns**  
  Authoring, validation, transformation, storage, and presentation are clearly separated.

- **Declarative first**  
  Semantics are expressed declaratively (YAML), not hard-coded in application logic.

- **Composable and modular**  
  Components can be used independently or combined as needed.

- **Technology-agnostic semantics**  
  SOyA overlays are independent of programming language, storage, or runtime.

---

## High-Level Component Overview

At a high level, SOyA consists of five main building blocks:

1. Semantic Overlay Definitions (YAML)
2. Core Library (`soya-js`)
3. Command Line Interface (CLI)
4. Repository Service
5. Optional UI / Form Components

These components can be combined in different topologies, depending on the use case.

---

## Semantic Overlay Definitions

Semantic overlays are the central artifact in SOyA.

They are:
- written in YAML
- versioned as plain text
- independent of any runtime
- reusable across tools and services

An overlay typically describes:
- constraints and validation rules
- transformations and derived views
- metadata and documentation
- optional form or UI hints

Overlays are *inputs* to the SOyA tooling ecosystem, not executable code.

---

## Core Library: soya-js

The **soya-js** library implements the core logic required to process semantic overlays.

Responsibilities include:
- parsing and resolving overlays
- applying validation logic
- executing transformations (e.g. jq, JOLT)
- exposing a stable programmatic API

The library is designed to be:
- embeddable in services or applications
- usable without the CLI
- independent of any repository or storage backend

Other components build on top of this library.

---

## Command Line Interface (CLI)

The SOyA CLI is a thin wrapper around `soya-js`.

Its purpose is to:
- provide a user-friendly entry point for developers
- support local authoring and testing
- enable scripting and CI/CD integration

Typical CLI commands include:
- validating data against overlays
- applying transformations
- inspecting overlay metadata

The CLI does not introduce additional semantics; it delegates all logic to the core library.

---

## Repository Service

The repository service provides a way to **publish, retrieve, and version**
semantic overlays.

Conceptually, it acts as:
- a distribution mechanism
- a coordination point between teams
- a source of stable references (e.g. DRIs)

Key responsibilities:
- storing overlays and metadata
- handling versions and immutability
- exposing a retrieval API

The repository does *not* interpret overlays; it only stores and serves them.

---

## UI and Form Components (Optional)

SOyA can optionally be used to derive **user-facing representations**, such as forms.

These components:
- consume overlays and profiles
- render forms or views dynamically
- reuse validation and semantics defined in YAML

UI components are intentionally decoupled from the core library to allow:
- multiple frontend frameworks
- domain-specific rendering logic
- independent evolution

---

## Typical Deployment Patterns

Common deployment patterns include:

- **Local authoring setup**  
  CLI + local overlays for validation and testing

- **Embedded service**  
  Application embeds `soya-js` directly

- **Central repository**  
  Shared overlay repository used by multiple consumers

- **End-to-end pipeline**  
  Repository + service + UI, with overlays as the single semantic source of truth

Not all use cases require all components.

---

## Responsibility Boundaries

A key design goal of SOyA is to keep responsibility boundaries explicit:

- Overlays define *what* the semantics are
- Libraries and tools define *how* they are applied
- Repositories define *where* they are stored
- Applications decide *when* and *why* they are used

This separation supports long-term maintainability and interoperability.

---

## Where to Go Next

- **soya-js Library** – API usage and integration details
- **CLI** – Commands and configuration
- **Repository Service** – API and deployment
- **Data Models** – DRI and versioning concepts
