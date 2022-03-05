# SOyA 🌱 Tutorial

*latest update: 6 February 2022*

This tutorial introduces the use of `soya`.

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

*Note:* since it makes sense to keep private keys and revocation information beyond a Docker session a directory is mounted in the container to persist files; create a local directory, `mkdir ~/.oydid`


## 1. Describing Data Models in YAML

### `meta` and `bases` Section

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