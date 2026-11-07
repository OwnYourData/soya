#!/bin/bash
# Prüfsummen der Abrufe, die eine Veröffentlichung nicht verändern darf:
# - TIDE_-Strukturen und unveränderte EEG_-Strukturen: JSON-LD, /yaml und /info,
#   je per Name und per DRI
# - Vorversionen von Strukturen, die neu veröffentlicht werden: JSON-LD und /yaml
#   per DRI (Name und /info ändern sich dabei gewollt)
# Vor und nach dem Veröffentlichen ausführen und die Ausgaben vergleichen.
# Aufruf: bash test/tide-snapshot.sh > datei.txt
set -euo pipefail
REPO="${SOYA_REPO:-https://soya.ownyourdata.eu}"
for id in \
  TIDE_EEGstammdaten z9eAqTCWatBBmttEfB8Q3SbbnHP7J2GfGXxcy77QEirhu \
  TIDE_EEGmember zAaGpXFWn9MvZQ3pskZ3EwZHQx8XYsGzYmKfLg4wwu1Mo \
  TIDE_Infrastructure z3LGgFNdzJAXzvBj5Sy75QYKQZ4jVUFCUr2R2za2k1L7N \
  TIDE_ConsumptionCommunity zCkZPfdksQT4UBvNCijMoUXNXGDg1c4FcxSs8suu7QUbA \
  TIDE_Timeseries z2nRmcZgrpUrki2ZNYcz1zCsHaRJxpGa1aNDth6gdMpPw \
  EEG_Member z9hSFcD18hLrgcz8Kbdo6kuumvMouhW85RHbtZQeHcnkY \
  EEG_Infrastructure z9BcHX3LvFiMftbwj9VkabKrpUW3VeZohc7y1egviB5wR \
  EEG_MasterData z9w7JyGcBuz38phvzRbwZ1gjGueJM6E244kiRcofM3WX6 \
  EEG_SeriesReference z5SUXX8BvZHtuhnd3gpVmZdqTynuLoJyfbiecDRF5RFqJ; do
  for sub in "" /yaml /info; do
    sum="$(curl -sS "$REPO/$id$sub" | shasum -a 256 | cut -d' ' -f1)"
    echo "$id$sub $sum"
  done
done
for dri in \
  z9J7fAyF6oo7fRXo1ZLnmEN8FTUzgyKV9duK65yx2zX6R; do
  for sub in "" /yaml; do
    sum="$(curl -sS "$REPO/$dri$sub" | shasum -a 256 | cut -d' ' -f1)"
    echo "$dri$sub $sum"
  done
done
