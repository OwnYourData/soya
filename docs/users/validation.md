# Validation

## Overview

SOyA uses **validation overlays** to define constraints for data instances. A validation overlay is an `OverlayValidation` element attached to a base and stored as part of the SOyA structure. In practice, this means that the structure contains both the semantic data model itself and, optionally, one or more overlays that add processing-related information such as validation rules.

For validation, SOyA currently uses **SHACL (Shapes Constraint Language)**. This allows a JSON-LD record, or an array of records, to be validated against a SOyA structure that includes a validation overlay.

## Validation as an Overlay

In the YAML authoring format, validations are defined under `content.overlays`. They do not replace the base definition; instead, they extend an existing base with validation constraints.

A validation overlay typically contains:

- `type: OverlayValidation`
- `base`: the base the validation applies to
- `name`: the overlay name
- `attributes`: per-attribute validation rules

## Example

The following validation overlay expresses SHACL-based constraints for the data structure:

```yaml
meta:
  name: PersonValidation

  overlays:
    - type: OverlayValidation
      base: https://soya.ownyourdata.eu/Person/Person
      name: SampleValidationOverlay
      attributes:
        name:
          cardinality: "1..1"
          length: "[0..20)"
          pattern: "^[A-Za-z ,.-]+$"
        dateOfBirth:
          valueRange: "[1900-01-01..*]"
        age:
          cardinality: "0..1"
          valueRange: "[0..*]"
        sex:
          cardinality: "0..1"
          valueOption:
            - male
            - female
            - other
```

This example shows the kinds of constraints that can be defined in a validation overlay:

- **cardinality** for required and optional fields
- **length** for string length constraints
- **pattern** for regular-expression checks
- **valueRange** for dates or numbers
- **valueOption** for enumerated values

Also note the reference to the base class to use HOST/Ontology/Class.

---

## Supported Constraints

A validation overlay is **not raw SHACL**. `soya init` recognises a fixed set of
constraint keys per attribute and translates them into SHACL; any other key is
dropped silently, so an unrecognised constraint does not fail the conversion —
it simply has no effect.

| YAML key | Example | Generated SHACL |
|----------|---------|-----------------|
| `cardinality` | `"1..1"`, `"0..*"` | `sh:minCount`, `sh:maxCount` |
| `length` | `"[0..20)"` | `sh:minLength`, `sh:maxLength` |
| `valueRange` (numeric) | `"[0..120]"` | `sh:minInclusive`, `sh:maxInclusive` |
| `valueRange` (date) | `"[1900-01-01..*]"` | `sh:minRange`, `sh:maxRange` (not enforced, see below) |
| `valueOption` | list of values or labelled options | `sh:in` |
| `pattern` | `"^[A-Za-z ,.-]+$"` | `sh:pattern` |
| `message` | `"Please provide a valid name"` | `sh:message` |
| `attributes` | nested block | nested `sh:property` / `sh:node` shapes |
| `or` | list of alternatives (attribute groups and/or value constraints) | `sh:or` |
| `unique` | `id` | `soya:uniqueKey` (checked by soya-js, see below) |

In range notation, square brackets include the bound and round brackets exclude
it — `"[0..20)"` becomes `sh:minLength 0` and `sh:maxLength 19` — while `*`
leaves the bound open. Exclusive bounds are adjusted for numbers only, not for
dates.

Enumerations can be written as plain values or as labelled options. The labelled
form additionally supplies the option captions used by generated forms:

```yaml
        energyEfficiencyClass:
          cardinality: "1..1"
          valueOption:
            - id: A
              label:
                en: Class A
                de: Klasse A
            - id: B
              label:
                en: Class B
                de: Klasse B
```

### Datatypes come from the base, not from the overlay

A validation overlay has **no per-attribute `datatype` key**. Writing one is not
an error — it is ignored and no `sh:datatype` constraint is produced. The
datatype of an attribute is declared once, in the base:

```yaml
content:
  bases:
    - name: Lamp
      attributes:
        luminousFlux: Integer
        ratedLifetime: Decimal
        productionDate: Date
        datasheet: AnyURI
```

Type names are matched case-insensitively against the XSD built-in types
(`String`, `Boolean`, `Integer`, `Decimal`, `Float`, `Double`, `Date`,
`DateTime`, `Time`, `AnyURI`, …); any other name is treated as a reference to
another base. The one place where `datatype` *is* evaluated is inside an `or`
group, where it distinguishes the alternative shapes.

### Alternatives (`or`) with value constraints

Each entry of an `or` list is one alternative. Inside an entry the keys
`datatype`, `nodeKind`, `pattern`, `length`, `valueRange` and `valueOption`
apply to the **value itself** and together form one alternative; all other keys
are attributes of the value (a nested object) and form a separate alternative.
`nodeKind` takes `IRI`, `BlankNode`, `Literal`, `BlankNodeOrIRI`,
`BlankNodeOrLiteral` or `IRIOrLiteral`; a JSON object in the data is a
`BlankNode` (or an `IRI` if it carries an `@id`).

```yaml
        authentication:            # a DID URL string or an embedded verification method
          message: "invalid 'authentication'"
          attributes:
            or:
              - datatype: String
                pattern: '^(did:[a-z0-9]+:\S+|#\S+)$'
              - id: { cardinality: "1..1" }
                type: { cardinality: "1..1" }
        serviceEndpoint:           # a URI string or a map
          message: "invalid 'serviceEndpoint'"
          attributes:
            or:
              - datatype: String
                pattern: '^[A-Za-z][A-Za-z0-9+.-]*:\S+$'
              - nodeKind: BlankNodeOrIRI
```

An alternative is reported with the attribute as result path and the
attribute's own `message`.

### Uniqueness within a set (`unique`)

`unique: <attribute>` on a `set<...>` attribute requires that no two elements
share the same value for the named attribute:

```yaml
        service:
          message: "invalid 'service'"
          unique: id
          attributes:
            id: { cardinality: "1..1" }
```

SHACL Core cannot express this, so `soya init` writes `soya:uniqueKey` into the
shape and `soya validate` (soya-js, also used by soya-web-cli) checks it after
the SHACL validation. A violation is reported with the attribute as result path
and its `message` (default: *Value '…' of '…' is not unique*). The check applies
to attributes on the top level of a validation overlay; other SHACL engines
ignore `soya:uniqueKey`.

### Attribute names are not checked against the base

Constraints are emitted for whatever attribute names appear in the overlay, even
for names the base does not define. A typo therefore yields a shape on a
property that never occurs in the data: with `cardinality: "0..1"` it silently
does nothing, with `"1..1"` every record fails with *Less than 1 values*. When a
constraint behaves unexpectedly, compare its spelling with the base first.

### Known limitation: date ranges are not enforced

A `valueRange` given as ISO dates is converted to `sh:minRange` / `sh:maxRange`.
These are not SHACL constraint components, so the SHACL engine ignores them and
a date outside the range validates as conforming:

```yaml
        productionDate:
          cardinality: "1..1"
          valueRange: "[1900-01-01..2000-12-31]"
```

A record with `"productionDate": "1850-05-01"` passes this overlay. Numeric
`valueRange` constraints (`sh:minInclusive` / `sh:maxInclusive`) *are* enforced.
Until this is resolved, check date bounds in the application, or approximate
them with a `pattern` constraint on the year.

---

## How SOyA Uses SHACL

When a validation overlay is converted into JSON-LD, SOyA expresses the validation rules using SHACL. In the example above, the YAML overlay is converted into a JSON-LD structure containing a `sh:NodeShape` with `sh:property` constraints.

This is important for users because it means:
- YAML remains the lightweight authoring format
- SHACL is the validation mechanism under the hood
- JSON-LD is the canonical internal representation

## Validating Data with `soya validate`

Validation is performed using the `soya validate` command. The input must be provided in JSON-LD format; if only flat JSON is available, it needs to be transformed beforehand using `soya acquire`.

The following example demonstrate the process with the example above:

```bash
echo '{"name": "SOyA", "dateOfBirth": "2021-11-17", "sex": "other"}' | \
    soya acquire Person | \
    soya validate Person 
```

This pipeline does three things:

1. create a sample JSON record,
2. converts it into JSON-LD using `soya acquire Person`,
3. validates the resulting data against the SOyA structure `Person`.

In other words, `soya validate` does not validate against a standalone SHACL file supplied by the user. Instead, it validates against the **SOyA structure identified by name**, provided that this structure includes a validation overlay.

### Missing classes are reported separately

In addition to the SHACL report, `soya validate` checks that every class
targeted by a node shape actually occurs in the data. If it does not, the result
is invalid even though the SHACL report itself is empty:

```json
{
  "isValid": false,
  "results": [],
  "classChecks": [
    { "message": "Missing class", "name": "https://soya.ownyourdata.eu/Lamp/Lamp" }
  ]
}
```

This is the typical symptom of validating a record that was not passed through
`soya acquire`, or that was acquired against a different structure. SHACL on its
own reports an empty data set as conforming, so this additional check is what
catches it.

## What to Keep in Mind

When working with validation in SOyA, the key points are:

- validations are defined as **overlays**
- overlays live **alongside the data structure** in the same SOyA structure
- the YAML definition is converted into **JSON-LD with SHACL-based constraints**
- validation is executed with **`soya validate`** against a SOyA structure

This keeps validation tightly coupled to the structure it belongs to, which helps ensure that data models and their constraints remain consistent across tools and repositories.

## What to do next

After validating your SOyA structures and data, the next step is to
process and transform data into the required target formats.

→ Continue with [`Transformation`](transformation.md) or go back to the [`Overview`](../README.md)