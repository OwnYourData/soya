# SOyA 🌱 Tutorial

*latest update: 2 April 2022*

This tutorial introduces the use of **S**emantic **O**verla**y** **A**rchitecture.

**<a id="top"></a>Content**    

* [Describing Data Models in YAML](#1-describing-data-models-in-yaml)
* [Publishing Structures](#2-publishing-structures)
* [Working with Instances](#3-working-with-instances)
* [Editing SOyA Instances in HTML Forms](#4-editing-soya-instances-in-html-forms)

## Prequisites

To execute commands in the steps below make sure to have the following tools installed:    
* `soya`: download and installation instructions [available here](https://github.com/OwnYourData/soya/tree/main/cli)    
    TL;DR: just run `npm i -g soya-cli@latest` or update with `npm update -g soya-cli`
* `jq`: download and installation instructions [available here](https://stedolan.github.io/jq/download/)    
* `jolt`: download and installation instructions [available here](https://github.com/bazaarvoice/jolt/)

Alternatively, you can use a ready-to-use Docker image with all tools pre-installed:    
[https://hub.docker.com/r/oydeu/soya-cli](https://hub.docker.com/r/oydeu/soya-cli) 

> Use the following command to start the image:    
> 
> ```console
> docker run -it --rm -v ~/.soya:/home/user oydeu/soya-cli
> ```
> 
> *Note:* since it makes sense to keep data beyond a Docker session, a directory is mounted in the container to persist files; create this local directory with the command `mkdir ~/.soya`

[back to top ↑](#top)

## 1. Describing Data Models in YAML

This section covers:
* [Bases](#meta-and-bases-section)
* [Overlays](#overlays-section)

### `meta` and `bases` Section

Start with creating a very simple data model for a person that only has the 2 attributes `firstname` and `lastname`:

Example: [`person_simple.yml`](examples/person_simple.yml)
```yaml
meta:
  name: Person

content:
  bases:
    - name: Person 
      attributes:
        firstname: String
        lastname: String
```

The 2 main sections in the YML file are `meta` (providing the name) and `content`. In this simple example the `content` includes only 1 `base` (or data model), namely the class `Person` with the attributes `firstname` and `lastname`.

Use the command `soya init` to create a JSON-LD document from the yml input file:
```bash
cat person_simple.yml | soya init
```
<details>
	<summary>Output</summary>

Use the following command to generate the output:    
```bash
curl -s https://playground.data-container.net/person_simple | jq -r .yml | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/Person/"
  },
  "@graph": [
    {
      "@id": "Person",
      "@type": "owl:Class",
      "subClassOf": "soya:Base"
    },
    {
      "@id": "firstname",
      "@type": "owl:DatatypeProperty",
      "domain": "Person",
      "range": "xsd:string"
    },
    {
      "@id": "lastname",
      "@type": "owl:DatatypeProperty",
      "domain": "Person",
      "range": "xsd:string"
    }
  ]
}
```

</details>

#### Attributes

Attributes are single fields in a base with a name and an associated type. The associated type can be one of the predefined values (`Boolean`, `Integer`, `Float`, `Decimal`, `String`, `Date`, `Time`, `DateTime`) or reference another base. The following example provides the description of an employee demonstrating the use of various attributes.

```yaml
meta:
  name: Employee

content:
  bases:
    - name: Employee
      attributes:
        name: String
        dateOfBirth: Date
        management: Boolean
        salary: Float
        employer: Company
    - name: Company
      attributes:
        company: String
        staff_count: Integer
```

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
curl -s https://playground.data-container.net/employee | jq -r .yml | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/Employee/"
  },
  "@graph": [
    {
      "@id": "Employee",
      "@type": "owl:Class",
      "subClassOf": "soya:Base"
    },
    {
      "@id": "name",
      "@type": "owl:DatatypeProperty",
      "domain": "Employee",
      "range": "xsd:string"
    },
    {
      "@id": "dateOfBirth",
      "@type": "owl:DatatypeProperty",
      "domain": "Employee",
      "range": "xsd:date"
    },
    {
      "@id": "management",
      "@type": "owl:DatatypeProperty",
      "domain": "Employee",
      "range": "xsd:boolean"
    },
    {
      "@id": "salary",
      "@type": "owl:DatatypeProperty",
      "domain": "Employee",
      "range": "xsd:float"
    },
    {
      "@id": "employer",
      "@type": "owl:DatatypeProperty",
      "domain": "Employee",
      "range": "Company"
    },
    {
      "@id": "Company",
      "@type": "owl:Class",
      "subClassOf": "soya:Base"
    },
    {
      "@id": "company",
      "@type": "owl:DatatypeProperty",
      "domain": "Company",
      "range": "xsd:string"
    },
    {
      "@id": "staff_count",
      "@type": "owl:DatatypeProperty",
      "domain": "Company",
      "range": "xsd:integer"
    }
  ]
}
```

</details>

#### `subClassOf`

To inherit properties from another existing class you can use `subClassOf` within a base. In the following example we inherit `Person` from `Agent` (which in turn is inherited from the class with the same name in the [FOAF Ontology](https://en.wikipedia.org/wiki/FOAF_(ontology)) - also note referencing the foaf namespace in the `meta` section at the top:

```yaml
meta:
  name: Foaf
  namespace:
    foaf: "http://xmlns.com/foaf/0.1/"

content:
  bases:
    - name: Agent
      subClassOf: foaf:agent
    - name: Person
      subClassOf: 
        - Agent
      attributes:
        firstName: String
        lastName: String
        did: string
```

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
curl -s https://playground.data-container.net/foaf_person | jq -r .yml | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/Foaf/",
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@graph": [
    {
      "@id": "Agent",
      "@type": "owl:Class",
      "subClassOf": "foaf:agent"
    },
    {
      "@id": "Person",
      "@type": "owl:Class",
      "subClassOf": [
        "Agent"
      ]
    },
    {
      "@id": "firstName",
      "@type": "owl:DatatypeProperty",
      "domain": "Person",
      "range": "xsd:string"
    },
    {
      "@id": "lastName",
      "@type": "owl:DatatypeProperty",
      "domain": "Person",
      "range": "xsd:string"
    },
    {
      "@id": "did",
      "@type": "owl:DatatypeProperty",
      "domain": "Person",
      "range": "xsd:string"
    }
  ]
}
```

</details>

#### Indentation    

`subClassOf` provides a powerful way to inherit properties from any parent class. With `subClasses` and indentation data model authors can implicitly define nested data structures as shown in the next example: `GET`, `POST`, `PUT`, and `DELETE` are subclasses of `Service` and inherit the `endpoint` property.

```yaml
# based on: https://rapidapi.com/blog/api-glossary/payload/
meta:
  name: RESTful
  context: https://ns.ownyourdata.eu/ns/soya-context.json 

content:
  bases: 
    - name: Service
      attributes:
        endpoint: String
      subClasses:
        - name: GET
          attributes:
            responsePayload: ResponsePayload
        - name: POST
          attributes:
            requestPayload: RequestPayload
            responsePayload: ResponsePayload
        - name: PUT
          attributes:
            requestPayload: RequestPayload
        - name: DELETE
    - name: RequestPayload
      attributes:
        interfaceType: String
        methodName: String
        parameters: String
    - name: ResponsePayload
      attributes:
        responseType: String
      subClasses:
        - name: ResponsePayloadFailed
          attributes:
            messages: String
        - name: ResponsePayloadOK
          attributes:
            data: String
```

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
curl -s https://playground.data-container.net/rest_api | jq -r .yml | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/RESTful/"
  },
  "@graph": [
    {
      "@id": "Service",
      "@type": "owl:Class",
      "subClassOf": "soya:Base"
    },
    {
      "@id": "endpoint",
      "@type": "owl:DatatypeProperty",
      "domain": "Service",
      "range": "xsd:string"
    },
    {
      "@id": "GET",
      "@type": "owl:Class",
      "subClassOf": "Service"
    },
    {
      "@id": "responsePayload",
      "@type": "owl:DatatypeProperty",
      "domain": "GET",
      "range": "ResponsePayload"
    },
    {
      "@id": "POST",
      "@type": "owl:Class",
      "subClassOf": "Service"
    },
    {
      "@id": "requestPayload",
      "@type": "owl:DatatypeProperty",
      "domain": "POST",
      "range": "RequestPayload"
    },
    {
      "@id": "responsePayload",
      "@type": "owl:DatatypeProperty",
      "domain": "POST",
      "range": "ResponsePayload"
    },
    {
      "@id": "PUT",
      "@type": "owl:Class",
      "subClassOf": "Service"
    },
    {
      "@id": "requestPayload",
      "@type": "owl:DatatypeProperty",
      "domain": "PUT",
      "range": "RequestPayload"
    },
    {
      "@id": "DELETE",
      "@type": "owl:Class",
      "subClassOf": "Service"
    },
    {
      "@id": "RequestPayload",
      "@type": "owl:Class",
      "subClassOf": "soya:Base"
    },
    {
      "@id": "interfaceType",
      "@type": "owl:DatatypeProperty",
      "domain": "RequestPayload",
      "range": "xsd:string"
    },
    {
      "@id": "methodName",
      "@type": "owl:DatatypeProperty",
      "domain": "RequestPayload",
      "range": "xsd:string"
    },
    {
      "@id": "parameters",
      "@type": "owl:DatatypeProperty",
      "domain": "RequestPayload",
      "range": "xsd:string"
    },
    {
      "@id": "ResponsePayload",
      "@type": "owl:Class",
      "subClassOf": "soya:Base"
    },
    {
      "@id": "responseType",
      "@type": "owl:DatatypeProperty",
      "domain": "ResponsePayload",
      "range": "xsd:string"
    },
    {
      "@id": "ResponsePayloadFailed",
      "@type": "owl:Class",
      "subClassOf": "ResponsePayload"
    },
    {
      "@id": "messages",
      "@type": "owl:DatatypeProperty",
      "domain": "ResponsePayloadFailed",
      "range": "xsd:string"
    },
    {
      "@id": "ResponsePayloadOK",
      "@type": "owl:Class",
      "subClassOf": "ResponsePayload"
    },
    {
      "@id": "data",
      "@type": "owl:DatatypeProperty",
      "domain": "ResponsePayloadOK",
      "range": "xsd:string"
    }
  ]
}
```

</details>

### `overlays` Section

Overlays provide addtional information for a defined base. This information can either be directly included in a structure together with a base or is provided independently and linked to the relevant base. The following types of overlays are pre-defined in the default context (https://ns.ownyourdata.eu/soya/soya-context.json):
* [Annotation](#annotation)
* [Format](#format)
* [Encoding](#encoding)
* [Form](#form)
* [Classification](#classification)
* [Alignment](#alignment)
* [Validation](#validation)
* [Transformation](#transformation)

It is possible to create additional overlay types by using another context.

#### Annotation

The *Annoation* overlay provides human-readable text and translations in different languages for base names, labels, and descriptions. In YAML it has the following format:

```yaml
meta:
  name: SampleAnnotation

content:
  overlays: 
    - type: OverlayAnnotation
      base: NameOfBase
      name: SampleAnnotationOverlay
      class: 
        label: 
          en: Name of the base
          de: der vergebene Name
      attributes:
        person: 
          label: 
            en: Person
            de:
              - die Person
              - der Mensch
        dateOfBirth: 
          label: 
            en: Date of Birth 
            de: Geburtsdatum
          comment: 
            en: Birthdate of Person
```

*Hint:* use the command `soya template annotation` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template annotation | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonAnnotation/"
  },
  "@graph": [
    {
      "@id": "Person",
      "label": {
        "en": [
          "Person"
        ],
        "de": [
          "die Person",
          "der Mensch"
        ]
      }
    },
    {
      "@id": "name",
      "label": {
        "en": [
          "Name"
        ],
        "de": [
          "Name"
        ]
      }
    },
    {
      "@id": "dateOfBirth",
      "label": {
        "en": [
          "Date of Birth"
        ],
        "de": [
          "Geburtsdatum"
        ]
      },
      "comment": {
        "en": [
          "Birthdate of Person"
        ]
      }
    },
    {
      "@id": "sex",
      "label": {
        "en": [
          "Gender"
        ],
        "de": [
          "Geschlecht"
        ]
      },
      "comment": {
        "en": [
          "Gender (male or female)"
        ],
        "de": [
          "Geschlecht (männlich oder weiblich)"
        ]
      }
    },
    {
      "@id": "OverlayAnnotation",
      "@type": "OverlayAnnotation",
      "onBase": "Person",
      "name": "PersonAnnotationOverlay"
    }
  ]
}
```

</details>

#### Format

The *Format* overlay defines how data is presented to the user. In YAML it has the following format:

```yaml
meta:
  name: SampleFormat

content:
  overlays: 
    - type: OverlayFormat
      base: NameOfBase
      name: SampleFormatOverlay
      attributes:
        dateOfBirth: DD/MM/YYYY
```

*Hint:* use the command `soya template format` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template format | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonFormat/"
  },
  "@graph": [
    {
      "@id": "dateOfBirth",
      "format": "DD/MM/YYYY"
    },
    {
      "@id": "OverlayFormat",
      "@type": "OverlayFormat",
      "onBase": "Person",
      "name": "PersonFormatOverlay"
    }
  ]
}
```

</details>

#### Encoding

The *Encoding* overlay specifies the character set encoding used in storing the data of an instance (e.g., UTF-8). In YAML it has the following format:

```yaml
meta:
  name: SampleEncoding

content:
  overlays: 
    - type: OverlayEncoding
      base: NameOfBase    
      name: SampleEncodingOverlay
      attributes:
        name: UTF-8
        company: ASCII
```

*Hint:* use the command `soya template encoding` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template encoding | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonEncoding/"
  },
  "@graph": [
    {
      "@id": "name",
      "encoding": "UTF-8"
    },
    {
      "@id": "dateOfBirth",
      "encoding": "UTF-8"
    },
    {
      "@id": "age",
      "encoding": "UTF-8"
    },
    {
      "@id": "sex",
      "encoding": "UTF-8"
    },
    {
      "@id": "OverlayEncoding",
      "@type": "OverlayEncoding",
      "onBase": "Person",
      "name": "PersonEncodingOverlay"
    }
  ]
}
```

</details>

#### Form

The *Form* overlay allows to configure rendering HTML forms for visualizing and editing instances. In YAML it has the following format:

```yaml
meta:
  name: SampleEncoding

content:
  overlays: 
    - type: OverlayEncoding
      base: NameOfBase    
      name: SampleEncodingOverlay
      attributes:
        name: UTF-8
        company: ASCII
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

*Hint:* use the command `soya template form` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template form | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/Person/"
  },
  "@graph": [
    {
      "@id": "PersonForm",
      "schema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "dateOfBirth": {
            "type": "string",
            "format": "date"
          }
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
              {
                "type": "Control",
                "scope": "#/properties/name"
              },
              {
                "type": "Control",
                "scope": "#/properties/dateOfBirth"
              }
            ]
          }
        ]
      }
    },
    {
      "@id": "OverlayForm",
      "@type": "OverlayForm",
      "onBase": "Person",
      "name": "PersonFormOverlay"
    }
  ]
}
```

</details>

#### Classification

The *Classification* overlay identifies a subset of available attributes for some purpose (e.g., personally identifiable information, configuring a list view). In YAML it has the following format:

```yaml
meta:
  name: SampleClassification

content:
  overlays: 
    - type: OverlayClassification
      base: NameOfBase
      name: SampleClassificationOverlay
      attributes:
        name: class1
        dateOfBirth: class1
        sex: 
          - class1
          - class2
```

*Hint:* use the command `soya template classification` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template classification | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonClassification/"
  },
  "@graph": [
    {
      "@id": "name",
      "classification": [
        "pii"
      ]
    },
    {
      "@id": "dateOfBirth",
      "classification": [
        "pii"
      ]
    },
    {
      "@id": "sex",
      "classification": [
        "pii",
        "gdpr_sensitive"
      ]
    },
    {
      "@id": "OverlayClassification",
      "@type": "OverlayClassification",
      "onBase": "Person",
      "name": "PersonClassificationOverlay"
    }
  ]
}
```

</details>

#### Alignment

The *Alignment* overlay allows to reference existing RDF definitions (e.g. foaf); this also includes declaring a derived base so that attributes can be pre-filled from a data store holding a record with that base (e.g., don’t require first name, last name to be entered but filled out automatically). In YAML it has the following format:

```yaml
meta:
  name: SampleAlignment
  namespace:
    foaf: "http://xmlns.com/foaf/0.1/"
    dc: "http://purl.org/dc/elements/1.1/"

content:
  overlays: 
    - type: OverlayAlignment
      base: NameOfBase
      name: SampleAlignmentOverlay
      attributes:
        name: 
          - foaf:name
          - dc:title
        sex: foaf:gender
```

*Hint:* use the command `soya template alignment` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template alignment | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonAlignment/",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "dc": "http://purl.org/dc/elements/1.1/"
  },
  "@graph": [
    {
      "@id": "name",
      "rdfs:subPropertyOf": [
        "foaf:name",
        "dc:title"
      ]
    },
    {
      "@id": "sex",
      "rdfs:subPropertyOf": [
        "foaf:gender"
      ]
    },
    {
      "@id": "OverlayAlignment",
      "@type": "OverlayAlignment",
      "onBase": "Person",
      "name": "PersonAlignmentOverlay"
    }
  ]
}
```

</details>

#### Validation

The *Validation* overlay allows to specify for each attribute in a base range selection, valid options, any other validation methods. Through validation a given JSON-LD record (or an array of records) can be validated against a SOyA structure that includes an validation overlay. Currently, SHACL ([Shapes Constraint Language](https://en.wikipedia.org/wiki/SHACL)) is used in validation overlays. In YAML it has the following format:

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

*Hint:* use the command `soya template validation` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template validation | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonValidation/"
  },
  "@graph": [
    {
      "@id": "PersonShape",
      "@type": "sh:NodeShape",
      "sh:targetClass": "Person",
      "sh:property": [
        {
          "sh:path": "name",
          "sh:minCount": 1,
          "sh:maxCount": 1,
          "sh:maxLength": 19,
          "sh:pattern": "^[a-z ,.'-]+$"
        },
        {
          "sh:path": "dateOfBirth",
          "sh:minCount": 1,
          "sh:maxCount": 1,
          "sh:minRange": {
            "@type": "xsd:date",
            "@value": "1900-01-01"
          }
        },
        {
          "sh:path": "age",
          "sh:maxCount": 1
        },
        {
          "sh:path": "sex",
          "sh:maxCount": 1,
          "sh:in": {
            "@list": [
              "male",
              "female",
              "other"
            ]
          }
        }
      ]
    },
    {
      "@id": "OverlayValidation",
      "@type": "OverlayValidation",
      "onBase": "Person",
      "name": "PersonValidationOverlay"
    }
  ]
}
```

</details>

#### Transformation

The *Transformation* overlay define a set of transformation rules for a data record. Transformations allow to convert a JSON-LD record (or an array of records) with a well-defined data model (based on a SOyA structure) into another data model using information from a tranformation overlay. Currently, [`jq`](https://stedolan.github.io/jq/) and [`Jolt`](https://github.com/bazaarvoice/jolt/#jolt) are available engines for transformation overlays. 

In YAML a transformation overlay for `jq` has the following format:

```yaml
meta:
  name: Sample_jq_transformation

content:
  overlays: 
    - type: OverlayTransformation
      name: SampleJqTransformationOverlay
      base: NameOfBase
      engine: jq
      value: |
        .["@graph"] | 
        {
          "@context": {
            "@version":1.1,
            "@vocab":"https://soya.data-container.net/PersonB/"},
          "@graph": map( 
            {"@id":.["@id"], 
            "@type":"PersonB", 
            "first_name":.["basePerson:firstname"], 
            "surname":.["basePerson:lastname"], 
            "birthdate":.["basePerson:dateOfBirth"], 
            "gender":.["basePerson:sex"]}
          )
        }
```

*Hint:* use the command `soya template transformation.jq` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template transformation.jq | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonA_jq_transformation/"
  },
  "@graph": [
    {
      "@id": "PersonATransformation",
      "engine": "jq",
      "value": ".[\"@graph\"] | \n{\n  \"@context\": {\n    \"@version\":1.1,\n    \"@vocab\":\"https://soya.data-container.net/PersonB/\"},\n  \"@graph\": map( \n    {\"@id\":.[\"@id\"], \n    \"@type\":\"PersonB\", \n    \"first_name\":.[\"basePerson:firstname\"], \n    \"surname\":.[\"basePerson:lastname\"], \n    \"birthdate\":.[\"basePerson:dateOfBirth\"], \n    \"gender\":.[\"basePerson:sex\"]}\n  )\n}\n"
    },
    {
      "@id": "OverlayTransformation",
      "@type": "OverlayTransformation",
      "onBase": "PersonA",
      "name": "TransformationOverlay"
    }
  ]
}
```

</details>


In YAML a transformation overlay for `Jolt` has the following format:

```yaml
meta:
  name: Sample_jolt_Transformation

content:
  overlays: 
    - type: OverlayTransformation
      name: SampleJoltTransformationOverlay
      base: PersonA
      engine: jolt
      value:
        - operation: shift
          spec: 
            "\\@context":
              "\\@version": "\\@context.\\@version"
              "#https://soya.data-container.net/PersonB/": "\\@context.\\@vocab"
            "\\@graph": 
              "*": 
                "#PersonB": "\\@graph[#2].\\@type"
                "\\@id": "\\@graph[#2].\\@id"
                "basePerson:firstname": "\\@graph[#2].first_name"
                "basePerson:lastname": "\\@graph[#2].surname"
                "basePerson:dateOfBirth": "\\@graph[#2].birthdate"
                "basePerson:sex": "\\@graph[#2].gender"
```

*Hint:* use the command `soya template transformation.jolt` to show an example on the command line

<details>
  <summary>Output</summary>

Use the following command to generate the output:    
```bash
soya template transformation.jolt | soya init
```

```json-ld
{
  "@context": {
    "@version": 1.1,
    "@import": "https://ns.ownyourdata.eu/ns/soya-context.json",
    "@base": "https://soya.data-container.net/PersonA_jolt_Transformation/"
  },
  "@graph": [
    {
      "@id": "PersonATransformation",
      "engine": "jolt",
      "value": [
        {
          "operation": "shift",
          "spec": {
            "\\@context": {
              "\\@version": "\\@context.\\@version",
              "#https://soya.data-container.net/PersonB/": "\\@context.\\@vocab"
            },
            "\\@graph": {
              "*": {
                "#PersonB": "\\@graph[#2].\\@type",
                "\\@id": "\\@graph[#2].\\@id",
                "basePerson:firstname": "\\@graph[#2].first_name",
                "basePerson:lastname": "\\@graph[#2].surname",
                "basePerson:dateOfBirth": "\\@graph[#2].birthdate",
                "basePerson:sex": "\\@graph[#2].gender"
              }
            }
          }
        }
      ]
    },
    {
      "@id": "OverlayTransformation",
      "@type": "OverlayTransformation",
      "onBase": "PersonA",
      "name": "TransformationOverlay"
    }
  ]
}
```

</details>

## 2. Publishing Structures

### Transform YAML to JSON-LD (`soya init`)

### Upload to Repository (`soya push`)

### Get Information (`soya info`)

### Compare with Existing Structure (`soya similar`)

### Download from Repository (`soya pull`)

### Use JSON-LD Playground (`soya playground`)

## 3. Working with Instances

### Transform flat-JSON Records into JSON-LD (`soya acquire`)

### Validate Record against a Structure (`soya validate`)

### Transfrom Instances between Structures (`soya transform`)

### Store Instances in a Semantic Container (`soya push`)

## 4. Editing SOyA Instances in HTML Forms

### JSON Forms Engine (`soya form`)

### Configure Forms Rendering

### Semantic Container and SOyA


&nbsp;    

## SOyA Tutorial Issues

Please report bugs and suggestions for new features in the tutorial using the [GitHub Issue-Tracker](https://github.com/OwnYourData/soya/issues) and follow the [Contributor Guidelines](https://github.com/twbs/ratchet/blob/master/CONTRIBUTING.md).

All examples in this tutorial are automated using [`pytest`](https://pypi.org/project/pytest/) - check out [test_tutorial.py](https://github.com/OwnYourData/soya/blob/main/tutorial/test_tutorial.py).    

If you want to contribute, please follow these steps:

1. Fork it!
2. Create a feature branch: `git checkout -b my-new-feature`
3. Make sure all examples are included in [test_tutorial.py](https://github.com/OwnYourData/soya/blob/main/tutorial/test_tutorial.py)
4. Commit changes: `git commit -am 'Add some feature'`
5. Push into branch: `git push origin my-new-feature`
6. Send a Pull Request

&nbsp;    

## Lizenz

[MIT License 2022 - OwnYourData.eu](https://raw.githubusercontent.com/OwnYourData/soya/main/LICENSE)
