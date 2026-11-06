#!/bin/bash
# Prüfsummen von JSON-LD, /yaml und /info der TIDE_-Strukturen, die eine
# EEG_-Fassung bekommen (je per Name und per heutiger DRI).
# Vor und nach dem Veröffentlichen ausführen und die Ausgaben vergleichen.
# Aufruf: bash test/tide-snapshot.sh > datei.txt
set -euo pipefail
REPO="${SOYA_REPO:-https://soya.ownyourdata.eu}"
for id in \
  TIDE_EEGstammdaten z9eAqTCWatBBmttEfB8Q3SbbnHP7J2GfGXxcy77QEirhu \
  TIDE_EEGmember zAaGpXFWn9MvZQ3pskZ3EwZHQx8XYsGzYmKfLg4wwu1Mo \
  TIDE_Infrastructure z3LGgFNdzJAXzvBj5Sy75QYKQZ4jVUFCUr2R2za2k1L7N \
  TIDE_ConsumptionCommunity zCkZPfdksQT4UBvNCijMoUXNXGDg1c4FcxSs8suu7QUbA \
  TIDE_Timeseries z2nRmcZgrpUrki2ZNYcz1zCsHaRJxpGa1aNDth6gdMpPw; do
  for sub in "" /yaml /info; do
    sum="$(curl -sS "$REPO/$id$sub" | shasum -a 256 | cut -d' ' -f1)"
    echo "$id$sub $sum"
  done
done
