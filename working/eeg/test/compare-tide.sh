#!/bin/bash
# Vergleicht EEG_MasterData, EEG_Member und EEG_Infrastructure mit ihrer TIDE_-Basis.
# Aufruf aus working/eeg: bash test/compare-tide.sh
# Erzeugt die EEG_-Fassung mit soya-cli (cli2) und holt die TIDE_-Fassung per DRI aus dem Repo.
set -euo pipefail
cd "$(dirname "$0")/.."
SOYA="node ../../cli2/dist/index.js"
REPO="${SOYA_REPO:-https://soya.ownyourdata.eu}"
TMP="$(mktemp -d)"
for pair in \
  EEG_MasterData:z9eAqTCWatBBmttEfB8Q3SbbnHP7J2GfGXxcy77QEirhu \
  EEG_Member:zAaGpXFWn9MvZQ3pskZ3EwZHQx8XYsGzYmKfLg4wwu1Mo \
  EEG_Infrastructure:z3LGgFNdzJAXzvBj5Sy75QYKQZ4jVUFCUr2R2za2k1L7N; do
  name="${pair%%:*}"; dri="${pair##*:}"
  echo "### $name gegen $dri"
  curl -sS "$REPO/$dri/yaml" > "$TMP/tide.yml"
  diff "$TMP/tide.yml" "$name.yml" || true
  $SOYA init < "$name.yml" > "$TMP/eeg.jsonld"
  $SOYA init < "$TMP/tide.yml" > "$TMP/tide-local.jsonld"
  curl -sS "$REPO/$dri" > "$TMP/tide-published.jsonld"
  echo "-- gegen TIDE-YAML, gleicher Konverter:"
  python3 test/compare.py "$TMP/eeg.jsonld" "$TMP/tide-local.jsonld"
  echo "-- gegen veröffentlichte TIDE-Fassung:"
  python3 test/compare.py "$TMP/eeg.jsonld" "$TMP/tide-published.jsonld"
done
rm -rf "$TMP"
