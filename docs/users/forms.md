# Forms

## Overview

SOyA can render **HTML forms** for viewing and editing data instances directly from a SOyA structure. Instead of hand-coding input fields, validation, and layout for every data model, SOyA derives a form description from the semantic information that is already present in the structure — the base, its attributes and types, human-readable labels from annotations, and the constraints from validation overlays.

The form description follows the [JSONForms](https://jsonforms.io/) format. JSONForms is a declarative framework for building form-based web UIs: it expresses a form through two artifacts and renders them at runtime with a UI library (React, Angular, or Vue). SOyA produces exactly these two artifacts, so any JSONForms-compatible renderer can display a SOyA form without further glue code.

---

## How JSONForms Describes a Form

In JSONForms a form is defined by two separate schemata:

- the **data schema** (a JSON Schema) describes *what* data is captured — the properties, their types, and which fields are required;
- the **UI schema** describes *how* that data is presented — the order of controls, their grouping, and the overall layout.

Both are plain JSON and are interpreted at runtime; the renderer maps each element to a concrete UI component that already handles data binding and validation.

A minimal example for a person looks like this. The data schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "dateOfBirth": { "type": "string", "format": "date" }
  },
  "required": ["name"]
}
```

And the matching UI schema, which arranges the two fields vertically inside a labelled group:

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Group",
      "label": "Person",
      "elements": [
        { "type": "Control", "scope": "#/properties/name" },
        { "type": "Control", "scope": "#/properties/dateOfBirth" }
      ]
    }
  ]
}
```

The key building blocks of a UI schema are **controls** and **layouts**. A `Control` binds a single field to an input via its `scope`, a [JSON Pointer](https://jsonforms.io/docs/uischema/controls) into the data schema (for example `#/properties/name`). A **layout** arranges other elements; JSONForms provides four core layouts:

- `VerticalLayout` stacks its elements beneath one another,
- `HorizontalLayout` places them side by side, each taking an equal share of the width,
- `Group` behaves like a vertical layout but adds a mandatory `label` heading,
- `Categorization` splits a form into labelled `Category` sections, typically rendered as tabs.

In SOyA terms, the data schema corresponds to the `schema` field and the UI schema to the `ui` field — names that recur throughout this page.

---

## Two Ways to Obtain a Form

SOyA offers two complementary paths to a JSONForms description, and the same command serves both.

The **default (auto-generated) form** is computed on the fly from the SOyA structure. SOyA inspects the base, derives a `schema` and a `ui` from its attributes, and returns them. This requires no extra authoring: any structure that defines a base can already be rendered as a form.

A **custom form** is provided explicitly through a **Form overlay** (`OverlayForm`). Here you supply a hand-crafted `schema` and `ui`, which gives full control over field order, grouping, labels, widgets, and layout. A structure can carry several Form overlays, each identified by a `tag` and a `language`, so different forms can be offered for the same base.

When a form is requested, SOyA looks for a stored form whose `language` and `tag` match the request and uses it; if none matches, it falls back to the automatically computed default form. Custom overlays therefore *extend* rather than replace the default behaviour — you only author a Form overlay when the generated form is not sufficient.

---

## Auto-Generated Forms

The default form is built directly from the semantic model, so most of the information needed already comes from the base and its overlays:

- **Attribute types** are mapped from the underlying XSD/RDF ranges to JSON Schema types — string-like types become `string`, integral types become `integer`, floating types become `number`, and booleans become `boolean`. Date-related types are mapped to the corresponding JSON Schema formats (`date`, `time`, `date-time`), which lets JSONForms render appropriate date and time pickers.
- **Nested bases** are expanded recursively: an attribute that references another base becomes a nested object, and list-valued attributes become arrays rendered as repeatable controls.
- **Labels and descriptions** are taken from annotation overlays. SOyA reads `rdfs:label` and `rdfs:comment` in the requested language and attaches them to the controls, so a form generated with `--language de` shows German captions where translations exist.
- **Constraints from validation overlays** are folded into the data schema. A `minCount` of at least one marks a field as `required`; a maximum length and a pattern become `maxLength` and `pattern`; and an enumeration (`sh:in`) becomes a list of options, rendered as a single- or multiple-choice control.

Because the generator reuses the [Annotation](authoring-yaml.md) and [Validation](validation.md) overlays you have already written, investing in good labels and constraints pays off twice: once for validation and once for the form.

---

## Custom Forms with the Form Overlay

When you need precise control over presentation, define a Form overlay. Like every other overlay, it is authored in YAML under `content.overlays` and references a base; it does not change the base itself.

A Form overlay contains:

- `type`: `OverlayForm`
- `base`: the base the form applies to
- `name`: the overlay name
- `schema`: the JSONForms **data schema** (JSON Schema)
- `ui`: the JSONForms **UI schema** (layout)
- `tag` *(optional)*: an identifier to distinguish several forms for the same base
- `language` *(optional)*: the language this form is intended for

The following overlay defines a custom form for a `Person` base:

```yaml
meta:
  name: SampleForm

content:
  overlays:
    - type: OverlayForm
      base: NameOfBase
      name: SampleFormOverlay
      schema:
        type: object
        properties:
          name:
            type: string
          dateOfBirth:
            type: string
            format: date
        required: []
      ui:
        type: VerticalLayout
        elements:
          - type: Group
            label: Person
            elements:
              - type: Control
                scope: "#/properties/name"
              - type: Control
                scope: "#/properties/dateOfBirth"
```

> Hint: use the command `soya template form` to display this example on the command line.

As with all SOyA overlays, the YAML definition is converted into JSON-LD with `soya init`. The resulting graph stores the form alongside the base under the identifier `<base>Form`, keeping the `schema`, `ui`, `tag`, and `language` values together with the overlay metadata (`@type: OverlayForm`, `onBase`, `name`):

```json
{
  "@id": "PersonForm",
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "dateOfBirth": { "type": "string", "format": "date" }
    },
    "required": []
  },
  "ui": {
    "type": "VerticalLayout",
    "elements": [
      {
        "type": "Group",
        "label": "Person",
        "elements": [
          { "type": "Control", "scope": "#/properties/name" },
          { "type": "Control", "scope": "#/properties/dateOfBirth" }
        ]
      }
    ]
  },
  "@type": "OverlayForm",
  "onBase": "Person",
  "name": "PersonFormOverlay"
}
```

The `schema` and `ui` you provide are passed through to JSONForms unchanged, so the full expressiveness of the JSONForms UI schema is available — horizontal arrangements, grouped sections, tabbed categorizations, multi-line text options, and [rules](https://jsonforms.io/docs/uischema/rules) for conditional visibility or enabling of controls.

---

## Rendering a Form on the Command Line

Forms are produced with the `soya form` command, which reads a SOyA structure from standard input and writes a JSONForms description (the `schema` and `ui`) to standard output. It accepts two options:

- `--language` — the language used for labels, given as a two-character ISO code (e.g. `en`, `de`)
- `--tag` — selects a specific stored form by its tag

A typical pipeline pulls a structure from the repository and renders its form:

```bash
soya pull Person | soya form
```

To request a particular custom form in a specific language:

```bash
soya pull Person | soya form --language en --tag MySpecialForm
```

If a stored Form overlay matches the requested `language` and `tag`, it is returned; otherwise SOyA returns the automatically generated default form. The output is ready to be handed to a JSONForms renderer in a web frontend, where the end user can view or edit the corresponding data instance.

---

## Rendering Forms in the Browser: SOyA-Form

For viewing and filling in forms without writing any code, SOyA provides a ready-to-use web application:

**[https://soya-form.ownyourdata.eu/](https://soya-form.ownyourdata.eu/)**

SOyA-Form is the visual counterpart to `soya form`. Where the command line returns the JSONForms `schema`/`ui` as JSON, this tool takes that same description and renders it as an interactive form, using the JSONForms Material renderers. It connects to a SOyA repository, so any published structure can be loaded and filled in directly in the browser.

### Loading a form

Start typing a structure name into the **SOyA Schema** field. The tool searches the repository as you type and offers matching structures (with their name and DRI) in a dropdown. Pick one and click **Load Form**, and the corresponding form is rendered.

If the structure provides several form variants, additional **Tag** and **Language** selectors appear, letting you switch between the available forms for the same base. These correspond directly to the `tag` and `language` of the Form overlays described above; when no specific variant is chosen, the default form is used.

### Entering data and copying it as JSON

As you fill in the rendered form, the entered values are validated and collected live. Below the form, a **Data** panel shows the captured record as formatted JSON, kept in sync with the form on every change. From there you can simply select and copy the JSON to use it elsewhere — for example to store it in a data container, send it to an API, or paste it into another tool.

The panel is **bidirectional**: editing the JSON in the Data panel updates the form fields as well, which makes it convenient to pre-fill a form, correct a value quickly, or start from an existing record.

### Sharing and embedding

The tool also produces a **Permalink** that encodes the selected structure, the chosen tag and language, and the current data. Sharing this link reopens the form in the same state, including any data already entered — useful for handing a pre-filled form to someone else or for bookmarking a frequently used form.

SOyA-Form can additionally be embedded into other web applications (for example via an `iframe`), and supports a light and a dark theme. Structure, tag, language, and initial data can all be passed as URL parameters, so a host application can open the tool pre-configured for a particular use case.

---

## How Form Overlays Work Internally

When a Form overlay is converted into JSON-LD via `soya init`, the `schema` and `ui` are stored as part of the SOyA structure under the `<base>Form` node, together with the `tag` and `language` selectors. This mirrors how other overlays are handled:

- YAML remains the lightweight authoring format,
- JSON-LD is the canonical internal representation stored by SOyA,
- the form lives **alongside** the base in the same structure rather than as a separate file.

At render time, `soya form` first computes the default form from the base and its overlays, then checks the stored static forms for one matching the requested `language` and `tag`. The matching static form wins; if there is none, the computed form is used as a sensible fallback. In both cases the result is a standard JSONForms `schema`/`ui` pair.

---

## What to Keep in Mind

When working with forms in SOyA, the key points are:

- forms are expressed in the **JSONForms** format: a data `schema` plus a UI `ui` schema
- a usable form can be **generated automatically** from any base — no Form overlay is required
- custom presentation is defined as an **overlay** of type `OverlayForm`, stored **alongside the base**
- the auto-generated form reuses **annotation labels** and **validation constraints** you have already authored
- multiple forms per base are distinguished by **`tag`** and **`language`**
- forms are rendered with **`soya form`**, optionally with `--language` and `--tag`
- the YAML definition is converted into **JSON-LD** using `soya init`

This keeps the form tightly coupled to the structure it belongs to, so data models, their constraints, and their user-facing representations stay consistent across tools and repositories.

---

## What to do next

After defining forms, the next step is typically to publish and version your
SOyA structures so that others can retrieve and reuse them.

→ Continue with [`Repository Usage`](repository.md) or go back to the [`Overview`](../README.md)
