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

This follows the general SOyA principle that a structure is a combination of **bases** and **overlays**.

## Example from the Tutorial

The SOyA tutorial provides the following validation overlay example:

```yaml
meta:
  name: SampleValidation
content:
  overlays:
    - type: OverlayValidation
      base: NameOfBase
      name: SampleValidationOverlay
      attributes:
        name:
          cardinality: "1..1"
          length: "[0..20)"
          pattern: "^[A-Za-z ,.'-]+$"
        dateOfBirth:
          cardinality: "1..1"
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

The tutorial also notes that this example can be displayed on the command line with:

```bash
soya template validation
```

and converted to JSON-LD with:

```bash
soya template validation | soya init
```

## How SOyA Uses SHACL

When a validation overlay is converted into JSON-LD, SOyA expresses the validation rules using SHACL. In the tutorial example, the YAML overlay is converted into a JSON-LD structure containing a `sh:NodeShape` with `sh:property` constraints.

This is important for users because it means:

- YAML remains the lightweight authoring format
- SHACL is the validation mechanism under the hood
- JSON-LD is the canonical internal representation

## Validating Data with `soya validate`

Validation is performed with the `soya validate` command.

The SOyA documentation provides the following example:

```bash
curl -s https://playground.data-container.net/cfa | soya acquire Employee | soya validate Employee
```

This pipeline does three things:

1. retrieves a sample JSON record,
2. converts it into JSON-LD using `soya acquire Employee`,
3. validates the resulting data against the SOyA structure `Employee`.

In other words, `soya validate` does not validate against a standalone SHACL file supplied by the user. Instead, it validates against the **SOyA structure identified by name**, provided that this structure includes a validation overlay.

## What to Keep in Mind

When working with validation in SOyA, the key points are:

- validations are defined as **overlays**
- overlays live **alongside the data structure** in the same SOyA structure
- the YAML definition is converted into **JSON-LD with SHACL-based constraints**
- validation is executed with **`soya validate`** against a SOyA structure

This keeps validation tightly coupled to the structure it belongs to, which helps ensure that data models and their constraints remain consistent across tools and repositories.
