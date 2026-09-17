# Reduced circuit notes

This repo ships a **21-cell, 2-hop** leaky-integrate-and-fire subcircuit. It is
**not** the FlyWire whole brain (~138,639 neurons).

## Why reduced

Loading the real graph needs ~852 MB of CC BY-NC connectome data (Zenodo 10676866)
plus a 32 MB annotation TSV. That is too heavy to vendor, and a browser game cannot
step 138k cells at 60 Hz. `scripts/download-connectome.sh` fetches annotations only;
the full edge list is documented, not required.

## What is real vs demo-tuned

| Piece | Status |
| --- | --- |
| Cell type names (DNp09, DNa02, MDN, DNp01, LC4, LPLC2, GRN) | Published DN→behavior / looming-escape dictionary (flyputer `fly.py`, `swatter.py`; fly-brain atlas) |
| FlyWire v783 root IDs on named DNs / a few sensors | Copied from the public fly-brain `neuron_atlas.json` |
| 2-hop layout, current-based LIF, ACh+/GABA− sign | flyputer `flysim.py` / Shiu-style toy |
| Synapse **weights** | Demo-tuned so the closed loop clears the shipped level |
| Jump hold | Giant Fiber starts the jump; a labelled VNC/muscle plant (`MotorPlant`) holds the button in the air and releases on landing (brain dataset has no VNC) |
| Mario left/right/jump | Readout of DNs, not an LLM policy |

## Tick loop

1. Observe (pose, ground, gap, enemy, goal) from game state, not pixels.
2. Fixed atlas encodes approach / inverse-size looming currents onto named sensory cells. Optional LLM A may add a clamped overlay on **sensory** channels only.
3. LIF steps 40 × 0.5 ms with persistent V / Isyn.
4. DNp09 / DNa02 / MDN / DNp01 spike counts threshold into keys; `MotorPlant` holds jump in the air.
5. Physics. Linear-readout 旁白 (LLM B optional). On fail, optional LLM C review.

Default path: no network, no API key.
