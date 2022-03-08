# SOyA 🌱 Tutorial

*latest update: 6 March 2022*

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

Attributes are single fields in a base with a name and an associated type. The associated type can be one of the predefined values (`Boolean`, `Integer`, `Float`, `String`, `Date`) or reference another base. The following example provides the description of an employee demonstrating the use of various attributes.

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

#### Annotation

#### Format

#### Encoding

#### Classification

#### Alignment

#### Validataion

#### Transformation

### Using Templages

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