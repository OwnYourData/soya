"""Vergleich einer EEG_-Struktur mit ihrer TIDE_-Basis.
Aufruf: python3 test/compare.py <eeg.jsonld> <tide.jsonld> [ALT=NEU]
@base (Repo-URL mit Name bzw. DRI) wird vor dem Vergleich vereinheitlicht.
ALT=NEU benennt in der TIDE_-Fassung vorab um (z. B. EEGstammdaten=MasterData),
um eine beabsichtigte Umbenennung der Base aus dem Vergleich herauszunehmen."""
import json, re, sys

BASE = re.compile(r'https://soya\.ownyourdata\.eu/[A-Za-z0-9_]+/')

def nodes(path, rename=None):
    text = BASE.sub('BASE/', json.dumps(json.load(open(path))))
    if rename:
        old, new = rename.split('=', 1)
        text = re.sub(r'\b%s' % re.escape(old), new, text)
    doc = json.loads(text)
    graph = {}
    for n in doc['@graph']:
        graph[n.get('@id') or json.dumps(n, sort_keys=True)] = n
    return doc['@context'], graph

ca, ga = nodes(sys.argv[1])
cb, gb = nodes(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
print('context', 'gleich' if ca == cb else 'VERSCHIEDEN')
only = sorted(set(ga) ^ set(gb))
print('Knoten', len(ga), len(gb), 'nur einseitig:', only or '-')
same = [k for k in ga if k in gb and ga[k] == gb[k]]
diff = [k for k in ga if k in gb and ga[k] != gb[k]]
types = lambda ks: sorted({str(ga[k].get('@type')) for k in ks})
print('gleich:', len(same), types(same))
print('verschieden:', len(diff), [(k, ga[k].get('@type')) for k in diff] or '-')
