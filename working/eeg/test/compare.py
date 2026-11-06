"""Vergleich einer EEG_-Struktur mit ihrer TIDE_-Basis.
Aufruf: python3 test/compare.py <eeg.jsonld> <tide.jsonld>
@base (Repo-URL mit Name bzw. DRI) wird vor dem Vergleich vereinheitlicht."""
import json, re, sys

BASE = re.compile(r'https://soya\.ownyourdata\.eu/[A-Za-z0-9_]+/')

def nodes(path):
    doc = json.load(open(path))
    doc = json.loads(BASE.sub('BASE/', json.dumps(doc)))
    graph = {}
    for n in doc['@graph']:
        graph[n.get('@id') or json.dumps(n, sort_keys=True)] = n
    return doc['@context'], graph

ca, ga = nodes(sys.argv[1])
cb, gb = nodes(sys.argv[2])
print('context', 'gleich' if ca == cb else 'VERSCHIEDEN')
only = sorted(set(ga) ^ set(gb))
print('Knoten', len(ga), len(gb), 'nur einseitig:', only or '-')
same = [k for k in ga if k in gb and ga[k] == gb[k]]
diff = [k for k in ga if k in gb and ga[k] != gb[k]]
types = lambda ks: sorted({str(ga[k].get('@type')) for k in ks})
print('gleich:', len(same), types(same))
print('verschieden:', len(diff), [(k, ga[k].get('@type')) for k in diff] or '-')
