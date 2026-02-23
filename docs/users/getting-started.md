# Getting Started – Available infrastructure and first steps

SOyA (Semantic Overlay Architecture) lets you **define, publish, and reuse data structures** (“SOyA Structures”) and work with them through a repository-backed workflow.  
This page focuses on **available infrastructure** and the **minimal first steps** to get productive.

![SOyA overview](../res/overview.png)

---

## Available infrastructure

### SOyA Repository (central element)
The core of SOyA is the **SOyA Repository**: an online storage for **SOyA Structures** with built-in **immutable versioning** and a convenient **human-readable addressing** layer.

Public infrastructure endpoints:

- **Web frontend:** `https://soya.ownyourdata.eu`
- **Repository API docs:** `https://api-docs.ownyourdata.eu/soya/`

> If you run your own instance, point your tools to your repository URL.  
> The workflow stays the same: author → publish → consume.

### How you interact with the repository
You have two equivalent entry points:

1. **Command line (CLI)**  
   Best for automation, CI, scripted publishing, and “docs-as-code” workflows.
   see [`SOyA CLI`](https://github.com/OwnYourData/soya/tree/main/cli) for details and installation
2. **Web frontend**  
   Best for browsing, exploring existing structures, and quick manual checks.
   see default SOyA Frontend here: https://soya.ownyourdata.eu

---

## Key concepts

### SOyA Structures
A **SOyA Structure** is the unit you create and publish to the repository.  
It typically starts as a human-authored file (often YAML) and is stored/published as a canonical structure representation in the repository.

### Versioning: DRI, tags, and the default `current`
Every structure exists in **multiple versions**:

- **DRI (Decentralized Resource Identifier)**  
  A **hash-based** identifier for one *exact* version of a structure (content-addressed).  
  Use DRIs when you need strict immutability and reproducibility.

- **Human-readable name**  
  A convenient stable name (e.g., `Person`) that can “move forward” to newer versions.

- **Tags**  
  Optional human-readable markers for versions.  
  A special tag **`current`** always points to the **latest published** version.

**Default behavior:** if you reference a structure **without specifying a tag**, SOyA treats it as **`current`**.

---

## First steps

### Step 1 — Choose your workflow
- **UI-first:** open `https://soya.ownyourdata.eu` and browse existing structures.
- **CLI-first:** install/run the [CLI](https://github.com/OwnYourData/soya/tree/main/cli) and work from local files.

### Step 2 — Create your first structure (minimal example)

Copy the following YAML into the online-editor ([show screenshot](../res/new_soya_online.png)) or create a file `person_simple.yml`:

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

### Step 3 — Initialize / compile the structure locally (CLI only)
Convert the YAML into a repository-ready JSON-LD structure representation:

```bash
cat person_simple.yml | soya init > Person.jsonld
```

### Step 4 — Push to the repository
Publish the structure in the repository by clicking "Push" in the online-editor ([show screenshot](../res/push_soya_online.png)) or run the following command:

```bash
cat Person.jsonld | soya push
```

Publishing will:
- store an **immutable version** addressable by its **DRI**, and
- update the **human-readable name** (and typically the `current` tag) to the newest version.

### Step 5 — Retrieve and inspect (CLI only)

Pull the latest version (implicitly `current`) on the command line:

```bash
soya pull Person > Person.current.jsonld
```

Inspect what a structure contains (DRI's of previous versions):

```bash
soya info Person
```

---

## What to do next

Once the basic publish/pull loop works, the usual next steps are:

- **Refine your structure** (attributes, types, constraints)
- **Add overlays** (e.g., validation, transformation, presentation/form behavior)
- **Use tags** for team workflows (`dev`, `staging`, `v1.0`, …) while keeping `current` as the default

→ Continue with [`Authoring YAML`](authoring-yaml.md) or go back to the [`Overview`](../README.md)