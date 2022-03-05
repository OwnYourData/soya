# SOyA 🌱 Tutorial

*latest update: 6 March 2022*

This tutorial introduces the use of **S**emantic **O**verla**y** **A**rchitecture.

**Content**    

* [Describing Data Models in YAML](#1-describe-data-model-in-yaml)
* [Publishing Structures](#2-publishing-structures)
* [Working with Instances](#3-working-with-instances)
* [Editing SOyA Instances in HTML Forms](#4-editing-soya-instances-in-html-forms)

## Prequisites

To execute commands in the steps below make sure to have the following tools installed:    
* `soya`: download and installation instructions [available here](https://github.com/OwnYourData/soya/tree/main/cli)    
* `jq`: download and installation instructions [available here](https://stedolan.github.io/jq/download/)    
* `jolt`: download and installation instructions [available here](https://github.com/bazaarvoice/jolt/)

Alternatively, you can use a ready-to-use Docker image with all tools pre-installed: [https://hub.docker.com/r/oydeu/soya-cli](https://hub.docker.com/r/oydeu/soya-cli). Use the following command to start the image:    

```console
docker run -it --rm -v ~/.soya:/home/user oydeu/soya-cli
```

*Note:* since it makes sense to keep data beyond a Docker session, a directory is mounted in the container to persist files; create this local directory with the command `mkdir ~/.soya`


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

#### Classes

* `subClassOf`    
* Indentation    

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