# Repository Usage

## Overview

The **SOyA Repository** is the central place where SOyA structures are stored, versioned, and shared. It is an online store for SOyA structures with two defining properties: **immutable, content-addressed versioning** and a convenient **human-readable addressing** layer on top.

This page is the deeper reference for working with the repository — publishing structures, retrieving specific versions, discovering existing structures, and understanding how addressing and versioning fit together. If you only need the minimal publish/pull loop to get going, start with [`Getting Started`](getting-started.md); this page assumes you are already past that first step.

The public infrastructure is available at:

- **Web frontend:** `https://soya.ownyourdata.eu`
- **Repository API docs:** `https://api-docs.ownyourdata.eu/soya/`

`https://soya.ownyourdata.eu` is also the default repository used by the CLI when no other endpoint is specified.

---

## Two Ways to Work with the Repository

You can interact with the repository through two equivalent entry points:

- the **CLI** (`soya`), best for automation, scripted publishing, CI pipelines, and "docs-as-code" workflows;
- the **web frontend**, best for browsing, exploring existing structures, and quick manual checks.

Both operate on the same repository and the same structures, so you can author and publish from the command line and review the result in the browser, or vice versa. The remainder of this page focuses on the CLI, since it makes each step explicit.

---

## Addressing and Versioning

A single structure usually exists in **many versions** over time. SOyA gives you three complementary ways to address them, each suited to a different need.

A **DRI (Decentralized Resource Identifier)** is a hash-based identifier for one *exact* version of a structure. Because it is derived from the content itself, it is immutable: the same DRI always resolves to byte-for-byte the same structure. Use a DRI whenever you need strict reproducibility — for example to pin a dependency or to reference the precise structure a dataset was validated against.

A **human-readable name** (e.g. `Person`) is a stable, memorable handle that *moves forward* as new versions are published. Referencing a structure by name gives you the latest version rather than a frozen one, which is what you usually want during active development.

**Tags** are optional human-readable markers attached to versions (for example `dev`, `staging`, or `v1.0`). One tag is special: **`current`** always points to the most recently published version. When you reference a structure **without** specifying a tag, SOyA treats the request as `current`.

In short: address by **name/`current`** for "the latest", by **tag** for "a named line such as staging", and by **DRI** for "this exact, frozen version".

---

## Publishing Structures

Publishing takes a structure you have authored locally and stores it in the repository.

If you already have a compiled JSON-LD structure (for example from `soya init`), push it with:

```bash
cat Person.jsonld | soya push
```

More commonly you can go straight from YAML using `soya init-push`, which is a shorthand for `soya init` followed by `soya push`, with the added benefit that the **original YAML file is also stored** in the repository alongside the compiled structure:

```bash
cat person.yaml | soya init-push
```

In either case, publishing does two things:

1. it stores an **immutable version** addressable by its **DRI**, and
2. it advances the **human-readable name** (and the `current` tag) to this newest version.

Because every push creates a new immutable version, publishing never overwrites earlier ones — the name simply moves forward while previous versions remain retrievable by their DRI.

---

## Retrieving Structures

Pull a structure from the repository with `soya pull`, addressing it by name or DRI. Without a tag, you get the `current` (latest) version:

```bash
soya pull Person > Person.jsonld
```

By default the structure is returned as JSON-LD. To retrieve the original YAML representation instead, use `--type yaml`:

```bash
soya pull Person --type yaml > person.yaml
```

To retrieve one exact, frozen version rather than the latest, pull by its DRI:

```bash
soya pull <DRI> > Person.pinned.jsonld
```

Retrieving a structure gives you the **complete** structure — the base together with any overlays it carries (annotations, validation, transformation, forms). This is why other SOyA operations such as `soya validate` and `soya form` can resolve a structure by name against the repository and immediately have everything they need.

---

## Discovering and Inspecting Structures

Before authoring something new, it is often worth checking what already exists.

List structures in the repository, optionally narrowing by name:

```bash
soya query
soya query Person
```

Find structures that are **similar** to one you already have — useful for spotting an existing model you could reuse or extend instead of duplicating. The command reads a JSON-LD document from standard input:

```bash
cat Person.jsonld | soya similar
```

Inspect a single structure, including the DRIs of its previous versions:

```bash
soya info Person
```

You can also compute the DRI of a local document without publishing it, which lets you check ahead of time how a structure would be addressed:

```bash
cat Person.jsonld | soya calculate-dri
```

---

## Choosing a Repository Endpoint

If you do not specify an endpoint, the CLI uses the default repository `https://soya.ownyourdata.eu`. To work against a different instance — for example a self-hosted repository or an organisation-internal one — pass the `--repo` option:

```bash
cat person.yaml | soya init-push --repo https://soya.example.org
soya pull Person --repo https://soya.example.org
```

The workflow is identical regardless of the endpoint: author → publish → consume. Only the target changes.

---

## Public and Protected Repositories

The public repository and the typical self-hosted setup are **openly readable**, and the `soya` CLI is designed for this case: it talks to the repository over its URL and does not send authentication credentials. There are no authentication flags on the CLI — the only repository-related option is `--repo`.

Some deployments run a **protected (private) repository** that requires authentication. Access to such repositories is supported at the **integration level** rather than through the CLI: the `soya-js` library can attach a bearer token to repository requests (its repository service supports "send authentication if available" and "require authentication" modes), and the SOyA-Form web service can be configured for a private repository. If you need to read from or publish to a protected repository, drive it through the library or a service configured with the appropriate credentials rather than the bare CLI.

For the API and library details behind authenticated access, see the developer documentation on the `soya-js` library and the repository service.

---

## What to Keep in Mind

When working with the SOyA Repository, the key points are:

- the repository provides **immutable versioning** (DRI) plus a **human-readable addressing** layer (name, tags)
- referencing a structure **without a tag** resolves to **`current`** (the latest version)
- publish compiled JSON-LD with **`soya push`**, or go straight from YAML with **`soya init-push`** (which also stores the YAML)
- every publish creates a **new immutable version**; the name moves forward, older versions stay retrievable by DRI
- retrieve with **`soya pull`** (add `--type yaml` for the YAML form), and pin exact versions by **DRI**
- discover and inspect with **`soya query`**, **`soya similar`**, and **`soya info`**
- the default endpoint is `https://soya.ownyourdata.eu`; target another instance with **`--repo`**
- the CLI targets **openly accessible** repositories; **protected repositories** are handled via the library or a configured service

---

## What to do next

With publishing, retrieval, and versioning in place, you have completed the
core SOyA user workflow: author structures, add overlays, and share them
through the repository.

→ Continue with [`FAQ`](faq.md) or go back to the [`Overview`](../README.md)
