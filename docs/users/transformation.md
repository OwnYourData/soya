# Transformation

## Overview

SOyA uses **transformation overlays** to define rules for converting data instances from one representation to another. A transformation overlay is an `OverlayTransformation` element attached to a base and stored as part of the SOyA structure. This means every structure can contain both the semantic data model itself and, optionally, one or more overlays that define how data should be mapped, restructured, or rendered into a different target format.

Transformations allow a JSON record, a JSON-LD record, or an array of such records, with a well-defined data model to be converted into another data model or representation. This is particularly useful when adapting data between systems with different field names, structures, or vocabularies, and when rendering records into text-based outputs such as Markdown or HTML.

---

## Transformation as an Overlay

In the YAML authoring format, transformation rules are defined under `content.overlays`. They do not replace the base definition; instead, they extend an existing base with transformation logic.

A transformation overlay contains:

- `type`: OverlayTransformation`
- `base`: the base the transformation applies to
- `name`: the overlay name
- `engine`: the transformation engine to use (`jq` or `handlebars`)
- `value`: the transformation specification in the syntax of the chosen engine

Like other overlays in SOyA, transformation overlays are authored in YAML and converted into JSON-LD. They can either be included directly in the same structure as the base they reference, or published as a standalone structure that links to an existing base in the repository.

---

## One Transformation per Structure

`soya transform` applies the **first overlay in the graph that carries an
`engine` field**. There is no selector comparable to the `--tag` and
`--language` options of `soya form`, so a structure holding two transformation
overlays is ambiguous: the second one can never be reached.

When several target formats are required for the same base, publish each
transformation as a structure of its own that references the base:

```yaml
meta:
  name: LampToEN18223

content:
  overlays:
    - type: OverlayTransformation
      name: LampToEN18223Overlay
      base: https://soya.ownyourdata.eu/Lamp/Lamp
      engine: jq
      value: |
        { "elements": [ ... ] }
```

Each target format then has a name of its own (`soya transform LampToEN18223`),
and adding another one later cannot change the behaviour of the existing ones.

---

## Supported Engines

SOyA currently supports three transformation engines:

- **jq** – a lightweight and flexible JSON processor. Transformations are written as jq filter expressions and are well suited for restructuring JSON or JSON-LD documents.
- **Handlebars** – a template engine for generating structured text or document-like output from JSON/JSON-LD input. Transformations are written as templates with placeholders and sections.
- **SenML** – normalization of [SenML](https://datatracker.ietf.org/doc/html/rfc8428) sensor data records (resolves base fields into fully qualified records). Unlike jq and Handlebars this engine takes no transformation specification; the overlay only selects the engine.

> **Note:** the previously available **JOLT** engine is no longer supported
> since the Node 24 stack (soya-js ≥ 0.9 / soya-cli ≥ 0.18). Existing
> `engine: jolt` overlays should be rewritten as `jq` or `handlebars`
> transformations.

In practice, the difference is straightforward:

- use **jq** when the target should again be JSON or JSON-LD
- use **Handlebars** when the target should be rendered output, such as HTML, Markdown, or another text-based representation

---

## Example: jq Transformation

The following transformation overlay converts a `Person` record into a
`Contact` representation — merging first and last name into a single field,
extracting the birth year from an ISO date, and grouping address fields into
a nested object:

```yaml
meta:
  name: Person_jq_transformation
content:
  overlays:
    - type: OverlayTransformation
      name: SampleJqTransformationOverlay
      base: https://soya.ownyourdata.eu/Person
      engine: jq
      value: |
        {
          "@type": "Contact",
          "fullName": (.firstname + " " + .lastname),
          "birthYear": (.dateOfBirth | split("-")[0] | tonumber),
          "address": {
            "street": .street,
            "city": .city
          }
        }
```

> Hint: use the command `soya template transformation.jq` to display another example on the command line.

For example, the following input record:

```json
{
  "firstname": "Alice", "lastname": "Müller",
  "dateOfBirth": "1990-05-01", "street": "Hauptgasse 3", "city": "Wien"
}
```

produces this output:

```json
{
  "@type": "Contact",
  "fullName": "Alice Müller",
  "birthYear": 1990,
  "address": { "street": "Hauptgasse 3", "city": "Wien" }
}
```

To apply this transformation on the command line:

```bash
echo '{ "firstname": "Alice", "lastname": "Müller",
  "dateOfBirth": "1990-05-01", "street": "Hauptgasse 3", "city": "Wien" }' | \
  soya transform Person_jq_transformation
```

The `value` field in an OverlayTransformation contains a standard jq expression that receives the input document and returns the transformed JSON output. This makes jq a good choice when:

- fields need to be renamed, merged, or restructured
- values must be computed or extracted (e.g., parsing dates)
- flat records should be reorganised into nested objects
- the output will be consumed by other SOyA or JSON-LD tools

---

## Example: Handlebars Transformation

The following transformation overlay uses the same `Person` input record as the
jq example above, but renders it into a Markdown document instead of JSON:

```yaml
meta:
  name: Person_handlebars_transformation
content:
  overlays:
    - type: OverlayTransformation
      name: SampleHandlebarsTransformationOverlay
      base: https://soya.ownyourdata.eu/Person
      engine: handlebars
      value:
        markdown: |
          # {{firstname}} {{lastname}}
          - **Date of Birth:** {{dateOfBirth}}
          - **Address:** {{street}}, {{city}}
```

> Hint: use the command `soya template transformation.handlebars` to display another example on the command line.

Unlike jq, the Handlebars `value` is an **object** whose keys define named
output slots, each holding a template string. In this example a single slot
named `markdown` is defined; the same overlay could just as well provide
additional slots (e.g., `html`, `text`) rendered from the same input.

Applied to the following input record:

```json
{
  "firstname": "Alice", "lastname": "Müller",
  "dateOfBirth": "1990-05-01", "street": "Hauptgasse 3", "city": "Wien"
}
```

the transformation produces this Markdown output:

```markdown
# Alice Müller
- **Date of Birth:** 1990-05-01
- **Address:** Hauptgasse 3, Wien
```

To apply this transformation on the command line:

```bash
echo '{ "firstname": "Alice", "lastname": "Müller",
  "dateOfBirth": "1990-05-01", "street": "Hauptgasse 3", "city": "Wien" }' | \
  soya transform Person_handlebars_transformation | jq -r '.markdown'
```

Note the final `jq -r '.markdown'` step: `soya transform` returns a JSON object
whose keys match the slot names defined under `value` in the overlay. The
rendered Markdown text is extracted from the `markdown` field and emitted as
raw text (`-r`) suitable for writing to a `.md` file or piping into a Markdown
renderer.

Handlebars templates are rendered against the input document using `{{...}}`
placeholders. Unlike jq, the output inside each slot is not constrained to JSON —
any text-based format can be produced. This makes Handlebars a good choice when:

- the output is a human-readable format such as Markdown, HTML, or plain text
- multiple output formats should be rendered from the same input in one overlay
- the structure of the output is fixed and values are inserted into predefined positions
- the template should be readable and editable by non-developers

---

## How Transformation Overlays Work Internally

When a transformation overlay is converted into JSON-LD via `soya init`, the engine name and transformation value are stored alongside the overlay metadata. The resulting JSON-LD structure contains:

- the overlay type `OverlayTransformation`
- the reference to the base via `onBase`
- the selected transformation `engine`
- the transformation `value`

This is important because:

- YAML remains the lightweight authoring format
- the engine identifier and transformation value are stored as part of the SOyA structure
- JSON-LD is the canonical internal representation used and stored by SOyA

As with other SOyA features, the repository stores the structure in JSON-LD, while YAML remains the preferred way to author and maintain it.

---

## Choosing an Engine

Both engines are useful, but they serve different purposes.

### Prefer `jq` when

- the result should remain JSON or JSON-LD
- attributes need to be renamed, filtered, or restructured
- the transformation logic is data-centric
- the output will be consumed by another machine-readable process

### Prefer `handlebars` when

- the result should be rendered text
- you want a simple view or export based on the data
- the structure of the output is mostly static and the data is inserted into placeholders
- you want to generate Markdown, HTML, or similar text-based formats

For many SOyA workflows, jq is the better fit for model-to-model transformations, while Handlebars is the better fit for presentation-oriented outputs.

---

## Deriving Transformations from Alignments (`soya map`)

Writing jq filters or Handlebars templates by hand is not always necessary.
If two SOyA structures are **semantically aligned**, `soya map` can derive a
Handlebars mapping template automatically.

### Alignment Overlays

An alignment overlay (`OverlayAlignment`) declares that an attribute of a
structure has the same meaning as a property of another vocabulary or
structure. Technically this is expressed as `rdfs:subPropertyOf` relations:

```yaml
meta:
  name: OYD_Company
  namespace:
    schema: "https://schema.org/"
    oyd_organisation: "https://soya.ownyourdata.eu/OYD_Organisation/"

content:
  overlays:
    - type: OverlayAlignment
      base: Company
      name: CompanyAlignmentOverlay
      attributes:
        # aligned to a shared, external vocabulary
        registered_name: schema:legalName
    - type: OverlayAlignment
      base: Phonebook
      name: PhonebookAlignmentOverlay
      attributes:
        # aligned directly to an attribute of another SOyA structure
        number: oyd_organisation:phone
```

The referenced prefixes (`schema:`, `oyd_organisation:`) must be declared in
`meta.namespace`. Use `soya template alignment` for a ready-made starting point.

### Generating a Mapping

```bash
$ soya map OYD_Company OYD_Organisation
{
  "registered_name": "{{name}}",
  "contact": {
    "number": "{{phone}}"
  },
  "location": "{{address}}"
}
```

The semantics of the two arguments:

- the **keys** of the generated template follow the shape of the **first**
  structure (`OYD_Company`) — this is the output format
- the **placeholders** reference attributes of the **second** structure
  (`OYD_Organisation`) — data of this structure serves as input

The direction can simply be reversed; nested attributes are expressed as
nested keys or dotted paths (`{{contact.number}}`):

```bash
$ soya map OYD_Organisation OYD_Company
{
  "name": "{{registered_name}}",
  "address": "{{location}}",
  "phone": "{{contact.number}}"
}
```

### How Matching Works Internally

`soya map` pulls both structures, merges their RDF graphs, and searches for
attribute pairs that are connected via `rdfs:subPropertyOf` paths. Two
attributes are considered mappable when

- both are aligned to the **same external property**
  (e.g. `registered_name` and `name` are both aligned to `schema:legalName`), or
- one attribute is aligned **directly** to the other
  (e.g. `number` → `oyd_organisation:phone`).

For every pair, the attribute paths are traced back (via `rdfs:domain` /
`rdfs:range`) to the structure's base class, which is how nested paths like
`contact.number` are constructed.

### What to Keep in Mind for Mappings

- both structures need alignment overlays that share a common vocabulary or
  reference each other — attributes without alignments are not mapped
- the generated template is a **starting point**: review it and extend it
  (e.g. formatting helpers) before using it in production
- the result can be used directly as the `value` of a `handlebars`
  transformation overlay (see above), turning an alignment into an executable
  transformation

---

## What to Keep in Mind

When working with transformation in SOyA, the key points are:

- transformations are defined as **overlays** of type `OverlayTransformation`
- overlays live **alongside the data structure** in the same SOyA structure
- input to `soya transform` must be **JSON-LD**
- use `soya acquire` first when starting from flat JSON
- the YAML definition is converted into **JSON-LD** using `soya init` or `soya init-push`
- transformation is executed with **`soya transform`** against a SOyA structure identified by name
- `jq` is best suited for JSON-to-JSON transformations
- `handlebars` is best suited for text- or view-oriented outputs
- **`soya map`** derives Handlebars mapping templates automatically from alignment overlays

---

## What to do next

After defining transformations, the next step is typically to connect them with validation, forms, or repository-based publication workflows.

→ Continue with [`Forms`](forms.md) or go back to the [`Overview`](../README.md)
