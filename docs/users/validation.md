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
  name: Person
content:
  bases:
    - name: Person
      attributes:
        name: String
        dateOfBirth: String
        age: Integer
  overlays:
    - type: OverlayValidation
      base: Person
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