# FAQ

This page collects common questions about using SOyA. It is a living
document — if your question is not answered here, we would love to hear it
(see [Still have a question?](#still-have-a-question) at the end).

---

## General

### What is SOyA in one sentence?

SOyA (Semantic Overlay Architecture) is a way to describe semantics — constraints, interpretations, transformations, and forms — *on top of* existing data models, without changing the original data. See the [`Overview`](overview.md) for the full picture.

### Is SOyA a replacement for JSON Schema, SHACL, or my domain standard?

No. SOyA complements these rather than competing with them. It *overlays* existing structures and reuses established technologies (for example SHACL for validation and JSON Schema for forms) instead of replacing them.

### When should I use SOyA — and when not?

SOyA is a good fit when you cannot or should not change the original data model, when semantics vary by use case, profile, or version, or when forms and validation should be derived from a shared semantic definition. You may not need it if a single static schema already captures all your requirements and is unlikely to change. The [`Overview`](overview.md) goes into more detail.

### Is SOyA open source?

Yes. SOyA is published under the Apache 2.0 License.

---

## Authoring

### Do I need to know JSON-LD to use SOyA?

No. You author structures in **YAML**, which is the human-friendly authoring format. SOyA converts YAML into JSON-LD, which is the canonical representation stored internally. The advanced semantic capabilities of JSON-LD remain available when you need them, but everyday modelling is done in YAML. See [`Authoring YAML`](authoring-yaml.md).

### What is the difference between a base and an overlay?

A **base** is the data model itself — a class with attributes. An **overlay** adds something *on top of* a base without changing it: labels and translations, validation constraints, transformations, form definitions, and so on. A structure can contain a base together with one or more overlays.

### Which overlay types exist?

The pre-defined overlays include Annotation (labels and translations), Format, Encoding, Form, Classification, Alignment, Validation, and Transformation. Validation, Transformation, and Form are covered in their own pages: [`Validation`](validation.md), [`Transformation`](transformation.md), and [`Forms`](forms.md).

### Do I have to use the CLI, or can I work in the browser?

Either. The CLI is best for automation, scripted publishing, and "docs-as-code" workflows; the web frontend at `https://soya.ownyourdata.eu` is best for browsing, editing, and quick checks. Both operate on the same repository. In the WebUI the YAML→JSON-LD conversion happens automatically when you save.

### How do I install the CLI?

The SOyA CLI is distributed as an npm package:

```bash
npm i -g soya-cli@latest
```

A ready-to-use Docker image with the CLI and related tools pre-installed is also available.

---

## Validation

### What technology does SOyA use for validation?

SOyA validation overlays are expressed using **SHACL** (Shapes Constraint Language). You author the constraints in YAML, and SOyA converts them into SHACL as part of the structure. See [`Validation`](validation.md).

### Why does `soya validate` not accept my plain JSON?

Validation runs against **JSON-LD** records. If you start from flat JSON, convert it first with `soya acquire`, then validate. Validation is performed against the SOyA structure identified by name — not against a standalone SHACL file you supply.

---

## Transformation

### Should I use jq or Handlebars for a transformation?

Use **jq** when the result should again be JSON or JSON-LD (renaming, restructuring, computing values). Use **Handlebars** when the result is rendered text such as Markdown, HTML, or plain text. Both are defined as `OverlayTransformation` overlays; see [`Transformation`](transformation.md).

---

## Forms

### Do I have to define a form by hand?

No. SOyA can generate a usable form automatically from any base, reusing the labels from annotation overlays and the constraints from validation overlays. You only author a **Form overlay** (`OverlayForm`) when you need precise control over layout, grouping, or widgets. See [`Forms`](forms.md).

### How do I show a form to end users?

Forms follow the [JSONForms](https://jsonforms.io/) format, so any JSONForms renderer can display them. The hosted **SOyA-Form** tool at `https://soya-form.ownyourdata.eu/` loads a structure from the repository, renders the form, lets users enter data, and shows the captured record as JSON. It can also be embedded into your own application via an `iframe`. See [`Forms`](forms.md) for the details and parameters.

---

## Repository and Versioning

### What is the difference between a name, a tag, and a DRI?

A **name** (e.g. `Person`) is a stable handle that moves forward to the latest version. A **tag** is a named marker for a version; the special tag **`current`** always points to the latest one, and referencing a structure without a tag resolves to `current`. A **DRI** is a content-addressed, immutable identifier for one exact version — use it when you need reproducibility. See [`Repository Usage`](repository.md).

### How do I publish and retrieve structures?

Publish compiled JSON-LD with `soya push`, or go straight from YAML with `soya init-push` (which also stores the original YAML). Retrieve with `soya pull <name | DRI>`, adding `--type yaml` for the YAML form. The full set of commands is described in [`Repository Usage`](repository.md).

### Can I run my own repository?

Yes. The default endpoint is `https://soya.ownyourdata.eu`, but you can point any command at another instance with the `--repo` option, including a self-hosted repository.

### Does SOyA support private or protected repositories?

The public repository and typical self-hosted setups are openly readable, and the CLI targets this case (it has no authentication flags). Protected repositories that require authentication are supported at the integration level — through the `soya-js` library, which can attach a bearer token, or via a service configured with credentials. See the developer documentation for the library and repository service.

---

## Still have a question?

This FAQ is an early version and we are actively expanding it. **If something
is unclear, missing, or you simply have a question we have not covered yet —
please send it our way.** Your questions directly shape this documentation.

You can reach us and follow ongoing discussion through the
**GitHub issue tracker** of the main SOyA repository, where you are welcome to
ask questions, report problems, and suggest new topics for this FAQ.

→ Go back to the [`Overview`](../README.md)
