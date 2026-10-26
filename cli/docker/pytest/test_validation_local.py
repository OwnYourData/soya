# Validierung gegen eine lokal übersetzte Struktur (ohne Veröffentlichung im Repo).
#
# Die Struktur aus 05_input/DidSetValidation.yaml wird mit `soya init` übersetzt
# und über einen lokalen HTTP-Server als Repository bereitgestellt; `soya validate`
# holt sie von dort (--repo). So prüfen die Tests den Compiler (yaml2soya) und die
# Validierung zusammen, ohne die Struktur zu veröffentlichen.
#
# Regressionen:
# - Eine Alternative im `or`, die nur aus `datatype` besteht, darf keine
#   bedingungslose sh:NodeShape erzeugen (sonst ist das sh:or immer wahr und
#   eingebettete Verifikationsmethoden werden nie geprüft).
# - Die eigene `message` eines Set-Attributs mit verschachtelten Attributen
#   steht im Ergebnis (nicht "Value does not have shape ...").
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
STRUCTURE = "DidSetValidation"
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
    with open(Path(cwd) / "05_input" / (STRUCTURE + ".yaml")) as f:
        process = subprocess.run(["soya", "init"], stdin=f, capture_output=True, text=True)
    assert process.returncode == 0
    structure = json.loads(process.stdout)
    (serve_dir / STRUCTURE).write_text(process.stdout)

    handler = functools.partial(QuietHandler, directory=str(serve_dir))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield {"url": "http://127.0.0.1:%d" % server.server_address[1], "structure": structure}
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
    or_lists = [n["sh:or"]["@list"] for n in walk(local_repo["structure"]) if isinstance(n.get("sh:or"), dict)]
    assert len(or_lists) > 0
    for alternatives in or_lists:
        for alternative in alternatives:
            assert set(alternative.keys()) - {"@type"}, "sh:or contains an alternative without constraints"


def test_set_message_on_list_element_shape(local_repo):
    overlay = validation_overlay(local_repo["structure"])
    shapes = {p["sh:path"]: p for p in overlay["sh:property"] if isinstance(p.get("sh:path"), str)}
    for attr in SET_ATTRIBUTES_WITH_MESSAGE:
        outer = shapes[attr]
        inner = [s for s in outer["sh:property"] if "sh:node" in s]
        assert len(inner) == 1
        assert inner[0].get("sh:message") == outer["sh:message"]


@pytest.mark.parametrize('input', sorted(glob.glob(cwd + '/05_input/*.json')))
def test_validate(local_repo, input):
    output_file = input.replace("/05_input/", "/05_output/")
    with open(output_file) as f:
        expected = json.load(f)
    with open(input) as f:
        process = subprocess.run(
            ["soya", "validate", STRUCTURE, "--repo", local_repo["url"]],
            stdin=f, capture_output=True, text=True,
        )
    assert process.returncode == 0
    result = json.loads(process.stdout)
    assert result["isValid"] == expected["isValid"]
    messages = sorted(m["value"] for r in result["results"] for m in r.get("message", []))
    assert messages == sorted(expected["messages"])
