#!/usr/bin/env bash
# Optional: download the real FlyWire v783 graph for exploration.
# This demo does NOT need these files — Auto Fly uses the reduced 21-cell circuit.
#
# Data license: FlyWire connectome is CC BY-NC 4.0 (non-commercial).
# Cite Dorkenwald et al. 2024 and Schlegel et al. 2024.
# Connections feather: Zenodo 10676866 (same source as migkapa/flyputer get_data.sh).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/data/flywire"
mkdir -p "$DEST"
echo "Downloading neuron annotations (~32 MB)…"
curl -L --fail -o "$DEST/annotations_783.tsv" \
  "https://raw.githubusercontent.com/flyconnectome/flywire_annotations/main/supplemental_files/Supplemental_file1_neuron_annotations.tsv"
echo "The ~852 MB proofread_connections_783.feather is not fetched by default."
echo "Get it from https://zenodo.org/records/10676866 if you want to expand the circuit."
echo "Wrote $DEST"
