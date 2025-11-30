#!/usr/bin/env bash
trap "echo Cancel; exit 1" SIGINT

REPO_URL="http://localhost:3200"

# Config
MEASUREMENTS=20
PER_MEASUREMENT=10
MODE="yaml"   # or: jsonld

YAML_DIR="./example_yaml"
JSONLD_DIR="./example_jsonld"

if [ "$MODE" = "yaml" ]; then
  FILES=($YAML_DIR/*)
  WRITE_CMD="soya init-push -r $REPO_URL"
elif [ "$MODE" = "jsonld" ]; then
  FILES=($JSONLD_DIR/*)
  WRITE_CMD="soya push -r $REPO_URL"
else
  exit 1
fi

NUM_FILES=${#FILES[@]}
if [ "$NUM_FILES" -eq 0 ]; then
  echo "no file for $MODE"
  exit 1
fi

echo "Benchmark Write-Performance SOyA"
echo "Mode:        $MODE"
echo "Repository:  $REPO_URL"
echo "Files used:  $NUM_FILES"
echo "----------------------------------------"

min_ms=0
max_ms=0
sum_ms=0

for j in $(seq 1 $MEASUREMENTS); do
  start_ns=$(date +%s%N)

  for k in $(seq 1 $PER_MEASUREMENT); do
    index=$(( ( (j-1) * PER_MEASUREMENT + (k-1) ) % NUM_FILES ))
    file="${FILES[$index]}"
    $WRITE_CMD < "$file" > /dev/null 2>&1
  done

  end_ns=$(date +%s%N)
  duration_ms=$(( (end_ns - start_ns) / 1000000 ))

  echo "Measurement $j: ${duration_ms} ms (${PER_MEASUREMENT} documents)"

  if [ "$j" -eq 1 ] || [ "$duration_ms" -lt "$min_ms" ]; then
    min_ms=$duration_ms
  fi

  if [ "$duration_ms" -gt "$max_ms" ]; then
    max_ms=$duration_ms
  fi

  sum_ms=$(( sum_ms + duration_ms ))
done

avg_ms=$(( sum_ms / MEASUREMENTS ))
total_docs=$(( MEASUREMENTS * PER_MEASUREMENT ))

echo "----------------------------------------"
echo "Number of measurements : $MEASUREMENTS"
echo "Total documents written: $total_docs"
echo "Minimum duration       : ${min_ms} ms"
echo "Maximum duration       : ${max_ms} ms"
echo "Average duration       : ${avg_ms} ms"