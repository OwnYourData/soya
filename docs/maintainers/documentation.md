# Documentation Playbook

This document defines how the SOyA documentation is structured and maintained.

## Structure

```
docs/
├── README.md          # entry point and table of contents
├── users/             # task-oriented guides (no implementation details)
├── developers/        # architecture, APIs, migration notes
├── maintainers/       # deployment, releases, this playbook
├── examples/          # small self-contained HTML examples
├── papers/            # academic publications
├── res/               # shared images/resources
└── index.bs/.html     # SOyA specification (bikeshed source + generated HTML)
```

## Sources of truth

To avoid documentation drift, each fact should live in exactly one place:

| Topic | Source of truth |
|-------|-----------------|
| CLI commands & options | `cli2/src/utils/cmd.ts` (help texts) → summarized in `developers/cli.md` |
| soya-js API | `lib2/src/index.ts` + `soya.ts` → summarized in `developers/soya-js.md` |
| web-cli HTTP API | `web-cli/http-openapi.json` (served at `/api-docs`) |
| Repository API | `repo2/swagger/` |
| YAML overlay syntax | `users/authoring-yaml.md` + templates in `cli2/res/templates/` |
| Expected CLI behavior | pytest suite in `cli2/docker/pytest/` |
| Node 24 migration | `developers/migration-node24.md` |

## Conventions

- User docs answer "how do I ...?" and must be runnable copy/paste examples
  against `https://soya.ownyourdata.eu`.
- Developer docs may reference source files with relative links.
- Every breaking change requires: README note in the affected component,
  an entry in `developers/migration-node24.md` (or a successor migration doc),
  and — if CLI output changes — regenerated pytest expected files.
- The specification (`index.bs`) is edited in bikeshed format; `index.html` is
  generated and must not be edited manually.

## Maintenance checklist (per release)

- [ ] New/changed CLI commands reflected in `developers/cli.md`
- [ ] New/changed library exports reflected in `developers/soya-js.md`
- [ ] `http-openapi.json` in sync with `web-cli/src/server.ts`
- [ ] Dead links checked in `docs/README.md`
