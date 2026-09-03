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

### Sharing via permalink

The tool produces a **Permalink** that encodes the selected structure, the chosen tag and language, and the current data. Sharing this link reopens the form in the same state, including any data already entered — useful for handing a pre-filled form to someone else or for bookmarking a frequently used form.

### Embedding the form in an application

Because SOyA-Form is driven entirely by URL parameters, it can be dropped into any web application via an `iframe` and configured to show just the form, with the surrounding application supplying the structure and reading back the data. The relevant parameters are:

- `schemaDri` — the name of the SOyA structure to load (the DRI can be given in `schemaKey`)
- `tag` — selects a specific form variant for the structure
- `language` — selects the form language (two-character ISO code, e.g. `en`, `de`)
- `viewMode` — controls how much of the UI is shown:
  - *(omitted)* — full standalone app: search field, variant selectors, form, the JSON **Data** panel, and the permalink
  - `embedded` — the form plus the tag/language selectors only; the search field and the data/permalink panels are hidden
  - `form-only` — just the rendered form, with no selectors or panels around it
- `theme` — `light` (default) or `dark`
- `data` — initial data to pre-fill the form, as a JSON string
- `url` — a URL the tool fetches the initial data from (with an optional bearer `token`) instead of passing it inline

A minimal embed that shows only the form for the `Person` structure in German, in dark mode, looks like this:

```html
<iframe
  src="https://soya-form.ownyourdata.eu/?schemaDri=Person&viewMode=form-only&language=de&theme=dark"
  width="100%"
  height="600"
  style="border: 0;">
</iframe>
```

When the form is embedded, the JSON **Data** panel is hidden, so the host application receives the entered data through the browser's `postMessage` channel instead: on every change the embedded form posts a `{ type: 'data', data: … }` message to the parent window, which the surrounding application can listen for. The host can also switch the form between light and dark mode at runtime by posting a `{ type: 'jsonforms-theme', theme: 'dark' }` message back to the `iframe`.

---

## Form Appearance: `variant` and `density`

JSONForms renders every input through a Material UI component, and the *look* of
that component is not part of the UI schema itself — it comes from the theme of
the rendering application. JSONForms v3 changed the default from the underlined
inputs of v2 to boxed **outlined** inputs, which are noticeably taller. In a form
that is mostly a repeating table (measurement series, time series, line items),
this can easily triple the height of the rendered form.

SOyA-Form therefore reads two optional presentation hints from the **root
element** of the `ui` schema, so a structure can state how it wants to be
rendered:

```yaml
      ui:
        type: VerticalLayout
        options:
          variant: standard      # standard | outlined | filled
          density: compact       # compact  | comfortable
        elements:
          - type: Control
            scope: "#/properties/name"
```

`variant` selects the Material UI input style:

- `standard` — underlined inputs without a surrounding box; this is the compact
  style JSONForms v2 used and the **default** in SOyA-Form
- `outlined` — each input framed by a box; the JSONForms v3 default, visually
  heavier but with clearer field boundaries
- `filled` — inputs on a shaded background

`density` controls the spacing around controls and table rows:

- `compact` — tight table cells, no reserved space for empty helper texts,
  smaller toolbar buttons; the **default** in SOyA-Form
- `comfortable` — the stock JSONForms/Material spacing with generous padding

Both keys are optional. Omitting them yields `standard` + `compact`, so existing
Form overlays automatically get the compact rendering; set
`variant: outlined` and/or `density: comfortable` explicitly to opt back into the
roomier JSONForms v3 defaults.

> These hints apply to the whole form. They are ignored by the `soya form`
> command (which only returns the `schema`/`ui` pair) and by any other JSONForms
> renderer that does not know about them, so they are safe to add to any Form
> overlay.

### Arrays: table or accordion

Repeating values are rendered either as a **table** — one row per entry, with the
property titles as column headers — or as an **accordion** with one expandable
panel per entry. Which of the two is used depends on the `detail` option of the
array control:

```yaml
          - type: Control
            scope: "#/properties/readings"
            label: Readings
            options:
              detail: DEFAULT        # forces the compact table rendering
              showSortButtons: false # omits the extra sort-button column
```

As soon as `detail` holds a nested UI schema (or any string other than
`DEFAULT`), JSONForms switches to the accordion rendering. The auto-generated
default form uses exactly that for list attributes, so if you want the compact
table for a long series of records, author a Form overlay with
`detail: DEFAULT`.

Two further notes for table-style arrays:

- `showSortButtons: true` adds a column with up/down arrows that costs roughly
  150 px of width — leave it off unless the order of entries is meaningful.
- Options set on individual controls do **not** reach the cells inside an array
  table; JSONForms dispatches those cells without the surrounding UI schema
  options. Per-column tweaks are therefore not available — use `variant` and
  `density` on the root element to influence the table as a whole.

A complete example for a quarter-hourly generation series:

```yaml
      ui:
        type: VerticalLayout
        options:
          variant: standard
          density: compact
        elements:
          - type: Control
            scope: "#/properties/meteringPoint"
          - type: Control
            scope: "#/properties/generation"
            label: Generation Data
            options:
              detail: DEFAULT
              showSortButtons: false
```

---

## Read-Only Forms

A form is often used to *display* a record rather than to capture one — a
measurement series pulled from a data container, an issued credential, an
archived submission. JSONForms offers several ways to lock the inputs; they all
end up in the same internal `enabled` flag, and they are evaluated in a fixed
order of precedence.

### `options.readonly` — the recommended way

Setting `readonly: true` in the `options` of an element locks that element. On a
layout it applies to everything below it, because layouts pass their enablement
down to their children — so putting it on the root of the `ui` schema locks the
whole form:

```yaml
      ui:
        type: VerticalLayout
        options:
          variant: standard
          density: compact
          readonly: true          # locks every control in this form
        elements:
          - type: Control
            scope: "#/properties/generation"
```

The same key works on a single control, which is the usual case for a form that
is mostly editable but carries a few derived or system-assigned fields:

```yaml
          - type: Control
            scope: "#/properties/meteringPoint"
            options:
              readonly: true
```

`readOnly` (capital O) is accepted as a synonym.

### `readOnly` in the data schema

A property can also declare itself immutable in the `schema`, which travels with
the data model rather than with the presentation:

```yaml
      schema:
        type: object
        properties:
          meteringPoint:
            type: string
            readOnly: true
```

### `rule` with `effect: DISABLE`

Older Form overlays lock fields through a rule:

```yaml
          - type: Control
            scope: "#/properties/generation"
            rule:
              effect: DISABLE
              condition:
                expectedValue: true
```

This still works: a condition that is neither a `LEAF` nor a schema-based
condition is treated as fulfilled, so `DISABLE` always applies. Note that the
condition here carries no `scope` — it is not testing anything, it is an
idiom for *always disabled*. Rules take **precedence over** `options.readonly`
on the same element, so the two should not be combined.

Rules are the right tool when the lock is *conditional* — then give the
condition a `scope` and an `expectedValue`, which is what rules are designed
for:

```yaml
            rule:
              effect: DISABLE
              condition:
                scope: "#/properties/status"
                expectedValue: "submitted"
```

For an unconditional lock, `options.readonly: true` states the intent more
directly and does not depend on how an incomplete condition is interpreted.

### What a locked form looks like

Locking is more than a visual hint — the renderer drops the editing affordances
entirely. In an array table the **delete** column and the **add** button
disappear, and the clear (✕) button of every text field is suppressed. A
read-only table therefore comes out noticeably narrower and tighter than the
editable one, which combines well with `density: compact`.

> Precedence, highest first: the host application's global read-only setting →
> a `rule` with `ENABLE`/`DISABLE` → `options.readonly` / `options.readOnly` →
> `readOnly` in the data schema → the enablement inherited from the parent
> layout.

---

## Dynamic Form Fields

Besides static `enum`/`oneOf` value lists, SOyA-Form supports two field types
whose choices come from an **external API at runtime**. Both are declared as
custom properties on the field's subschema inside a Form overlay — the rest of
the schema/ui stays ordinary JSONForms.

Both expect the API to return a JSON array in `oneOf` notation, i.e. entries
with a stored value (`const`) and a display label (`title`):

```json
[
  { "const": "AT", "title": "Austria" },
  { "const": "DE", "title": "Germany" },
  { "const": "CH", "title": "Switzerland" }
]
```

> **Note:** the API is called directly from the browser, so the endpoint must
> allow cross-origin requests (CORS) from the SOyA-Form origin.

### Dynamic Dropdown (`enumApi`)

A field with an `enumApi` property is rendered as a dropdown whose values are
fetched **once when the form loads**. This suits value lists that change over
time but are small enough to load completely (countries, departments, units).

```yaml
meta:
  name: EmployeeOnboarding

content:
  bases:
    - name: Employee
      attributes:
        name: String
        department: String

  overlays:
    - type: OverlayForm
      base: Employee
      name: EmployeeFormOverlay
      language: en
      schema:
        type: object
        properties:
          name:
            type: string
          department:
            type: string
            enumApi: "https://api.example.com/departments"
        required:
          - name
      ui:
        type: VerticalLayout
        elements:
          - type: Control
            scope: "#/properties/name"
          - type: Control
            scope: "#/properties/department"
```

At load time SOyA-Form fetches `https://api.example.com/departments`
(`Accept: application/json`), removes the `enumApi` property, and inserts the
response as the field's `oneOf` — the user sees a regular dropdown with the
current departments. If the API responds with the example above, selecting
"Austria" stores `"AT"` in the form data.

> `enumApi` is evaluated for the properties on the top level of the form
> schema.

### Search-as-you-type (`saytApi`)

For datasets that are too large for a dropdown (customer lists, product
catalogs, medical terminologies), a field with a `saytApi` property is
rendered as an **autocomplete**: starting at the second typed character, the
form queries the API with the current input and shows the matching entries as
suggestions.

```yaml
    - type: OverlayForm
      base: Order
      name: OrderFormOverlay
      language: en
      schema:
        type: object
        properties:
          product:
            type: string
            saytApi: "https://api.example.com/products"
      ui:
        type: VerticalLayout
        elements:
          - type: Control
            scope: "#/properties/product"
```

While the user types `lap`, the form issues:

```
GET https://api.example.com/products?q=lap&q_field=title
```

The endpoint is expected to filter its entries by the `q` value (matching the
field named in `q_field`, i.e. the display label) and to answer in the same
`[{ "const": ..., "title": ... }]` format. Picking the suggestion
"Laptop 15-inch" stores its `const` value in the form data; the label is
resolved back automatically when the form is re-opened with existing data.
Responses are cached per query and stale requests are cancelled while typing.

### Authenticated Endpoints (`auth_token`)

If the API requires authentication, add an `auth_token` property next to
`enumApi`/`saytApi`. Its value is **not the token itself** but the *name of a
URL query parameter* of the form URL from which the token is read at runtime —
tokens therefore never end up inside the (publicly stored) SOyA structure:

```yaml
          department:
            type: string
            enumApi: "https://api.example.com/departments"
            auth_token: "token"
```

When the form is opened as

```
https://soya-form.ownyourdata.eu/?schemaDri=EmployeeOnboarding&token=eyJhbGciOi...
```

every `enumApi`/`saytApi` request for this field carries the header

```
Authorization: Bearer eyJhbGciOi...
```

This plays well with embedding: the host application obtains the token
(e.g. via its own OAuth flow) and passes it into the `iframe` URL. Two things
to keep in mind:

- the token is part of the form URL — do **not** include it in shared
  permalinks, and prefer short-lived tokens;
- the parameter name is freely choosable (`auth_token: "myToken"` reads
  `&myToken=...`), so different fields can even use different tokens.

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
- the rendering style is stated on the root of the `ui` schema via **`options.variant`** (`standard` | `outlined` | `filled`) and **`options.density`** (`compact` | `comfortable`); the default is `standard` + `compact`
- forms that only display data are locked with **`options.readonly: true`** — on the root element for the whole form, on a single control for individual fields; a `rule` with `effect: DISABLE` does the same and takes precedence
- forms are rendered with **`soya form`**, optionally with `--language` and `--tag`
- the YAML definition is converted into **JSON-LD** using `soya init`

This keeps the form tightly coupled to the structure it belongs to, so data models, their constraints, and their user-facing representations stay consistent across tools and repositories.

---

## What to do next

After defining forms, the next step is typically to publish and version your
SOyA structures so that others can retrieve and reuse them.

→ Continue with [`Repository Usage`](repository.md) or go back to the [`Overview`](../README.md)
