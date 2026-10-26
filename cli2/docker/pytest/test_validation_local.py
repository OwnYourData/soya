# Validierung gegen lokal übersetzte Strukturen (ohne Veröffentlichung im Repo).
#
# Jede Struktur 05_input/<Name>.yaml wird mit `soya init` übersetzt und über einen
# lokalen HTTP-Server als Repository bereitgestellt; `soya validate --repo` holt
# sie von dort. Die Fälle zu einer Struktur liegen in 05_input/<Name>/*.json, die
# erwarteten Ergebnisse (isValid und Meldungen) in 05_output/<Name>/*.json.
# So prüfen die Tests den Compiler (yaml2soya) und die Validierung zusammen,
# ohne eine Struktur zu veröffentlichen.
#
# Regressionen:
# - Eine Alternative im `or`, die nur aus `datatype` besteht, darf keine
#   bedingungslose sh:NodeShape erzeugen (sonst ist das sh:or immer wahr und
#   eingebettete Verifikationsmethoden werden nie geprüft).
# - Die eigene `message` eines Set-Attributs mit verschachtelten Attributen
#   steht im Ergebnis (nicht "Value does not have shape ...").
# - `cardinality` eines Set-Attributs mit verschachtelten Attributen wirkt
#   gleich, egal ob es in der YAML vor oder nach `attributes` steht.
import functools
import glob
import json
import os
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

cwd = os.getcwd()
INPUT_DIR = Path(cwd) / "05_input"
SET_ATTRIBUTES_WITH_MESSAGE = [
    "verificationMethod",
    "authentication",
    "assertionMethod",
    "keyAgreement",
    "capabilityInvocation",
    "capabilityDelegation",
]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


@pytest.fixture(scope="module")
def local_repo(tmp_path_factory):
    serve_dir = tmp_path_factory.mktemp("repo")
    structures = {}
    for yaml_file in sorted(INPUT_DIR.glob("*.yaml")):
        with open(yaml_file) as f:
            process = subprocess.run(["soya", "init"], stdin=f, capture_output=True, text=True)
        assert process.returncode == 0
        structures[yaml_file.stem] = json.loads(process.stdout)
        (serve_dir / yaml_file.stem).write_text(process.stdout)

    handler = functools.partial(QuietHandler, directory=str(serve_dir))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield {"url": "http://127.0.0.1:%d" % server.server_address[1], "structures": structures}
    server.shutdown()
    server.server_close()


def walk(node):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from walk(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk(value)


def validation_overlay(structure):
    return next(g for g in structure["@graph"] if g.get("@type") == "OverlayValidation")


def test_or_has_no_unconstrained_alternative(local_repo):
    structure = local_repo["structures"]["DidSetValidation"]
    or_lists = [n["sh:or"]["@list"] for n in walk(structure) if isinstance(n.get("sh:or"), dict)]
    assert len(or_lists) > 0
    for alternatives in or_lists:
        for alternative in alternatives:
            assert set(alternative.keys()) - {"@type"}, "sh:or contains an alternative without constraints"


def test_set_message_on_list_element_shape(local_repo):
    overlay = validation_overlay(local_repo["structures"]["DidSetValidation"])
    shapes = {p["sh:path"]: p for p in overlay["sh:property"] if isinstance(p.get("sh:path"), str)}
    for attr in SET_ATTRIBUTES_WITH_MESSAGE:
        outer = shapes[attr]
        inner = [s for s in outer["sh:property"] if "sh:node" in s]
        assert len(inner) == 1
        assert inner[0].get("sh:message") == outer["sh:message"]


def test_set_cardinality_independent_of_order(local_repo):
    def shapes(name):
        structure = local_repo["structures"][name]
        base = structure["@context"]["@base"]
        return json.loads(json.dumps(validation_overlay(structure)["sh:property"]).replace(base, ""))

    first = shapes("CardinalityFirst")
    assert first == shapes("CardinalityLast")
    assert first[0]["sh:path"] == "group"
    inner = [s for s in first[0]["sh:property"] if "sh:node" in s][0]
    assert (inner["sh:minCount"], inner["sh:maxCount"]) == (1, 2)


@pytest.mark.parametrize('input', sorted(glob.glob(cwd + '/05_input/*/*.json')))
def test_validate(local_repo, input):
    structure_name = Path(input).parent.name
    output_file = input.replace("/05_input/", "/05_output/")
    with open(output_file) as f:
        expected = json.load(f)
    with open(input) as f:
        process = subprocess.run(
            ["soya", "validate", structure_name, "--repo", local_repo["url"]],
            stdin=f, capture_output=True, text=True,
        )
    assert process.returncode == 0
    result = json.loads(process.stdout)
    assert result["isValid"] == expected["isValid"]
    messages = sorted(m["value"] for r in result["results"] for m in r.get("message", []))
    assert messages == sorted(expected["messages"])
