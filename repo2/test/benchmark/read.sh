#!/usr/bin/env bash
set -euo pipefail

# Konfiguration (per Environment überschreibbar)
MEASUREMENTS=${MEASUREMENTS:-20}        # Anzahl Messungen
PER_MEASUREMENT=${PER_MEASUREMENT:-10}    # Reads pro Messung
REPO_URL=${REPO_URL:-http://localhost:3200}
SOYA_CMD=${SOYA_CMD:-soya}

API_URL="$REPO_URL/api/soya/query"

echo "SOyA Read-Benchmark"
echo "Repository URL        : $REPO_URL"
echo "Measurements          : $MEASUREMENTS"
echo "Reads per measurement : $PER_MEASUREMENT"
echo "----------------------------------------"

########################################
# Namen aller vorhandenen SOyA-Elemente holen
########################################

echo "Read available SOyA records..."

# Ergebnis von:
# curl -s http://localhost:3200/api/soya/query | jq 'map(.name)'
# → ["Person","Person_Test",...]
NAMES=($(curl -s "$API_URL" | jq -r 'map(.name)[]'))

NUM_NAMES=${#NAMES[@]}
if [ "$NUM_NAMES" -eq 0 ]; then
  echo "Benchmark canceled"
  exit 1
fi

echo "Found records: $NUM_NAMES"
echo "----------------------------------------"

########################################
# Statistik-Variablen
########################################

min_ms=0
max_ms=0
sum_ms=0
total_reads=0

########################################
# Benchmark-Schleifen
########################################

for j in $(seq 1 "$MEASUREMENTS"); do
  start_ns=$(date +%s%N)

  for k in $(seq 1 "$PER_MEASUREMENT"); do
    # Round-Robin über die vorhandenen Namen
    index=$(( ( (j-1) * PER_MEASUREMENT + (k-1) ) % NUM_NAMES ))
    name="${NAMES[$index]}"

    # Ein Element lesen
    # Beispiel: soya pull Person
    $SOYA_CMD pull "$name" -r $REPO_URL > /dev/null 2>&1

    total_reads=$(( total_reads + 1 ))
  done

  end_ns=$(date +%s%N)
  duration_ms=$(( (end_ns - start_ns) / 1000000 ))

  echo "Measurement $j: ${duration_ms} ms (${PER_MEASUREMENT} reads)"

  # Min/Max/Summe aktualisieren
  if [ "$j" -eq 1 ] || [ "$duration_ms" -lt "$min_ms" ]; then
    min_ms=$duration_ms
  fi

  if [ "$duration_ms" -gt "$max_ms" ]; then
    max_ms=$duration_ms
  fi

  sum_ms=$(( sum_ms + duration_ms ))
done

########################################
# Ergebnisse
########################################

avg_ms=$(( sum_ms / MEASUREMENTS ))

echo "----------------------------------------"
echo "Number of measurements : $MEASUREMENTS"
echo "Total reads performed  : $total_reads"
echo "Minimum duration       : ${min_ms} ms"
echo "Maximum duration       : ${max_ms} ms"
echo "Average duration       : ${avg_ms} ms"