/**
 * Current-based leaky integrate-and-fire, after flyputer's `run_lif`
 * (Shiu-style toy LIF: qualitative downstream dynamics, not biophysics).
 *
 * Persistent membrane / synaptic state is kept across game ticks so the
 * closed loop is a real dynamical system, not a stateless lookup.
 */

export interface LifParams {
  dt: number;
  gain: number;
  vTh: number;
  tRef: number;
}

export const DEFAULT_LIF: LifParams = {
  dt: 0.5, // ms of brain time per substep
  gain: 1.0, // compressed synapse counts; flyputer uses 0.5 on real FlyWire weights
  vTh: 15,
  tRef: 2,
};

export class LifEngine {
  readonly n: number;
  readonly W: Float32Array; // row-major W[post * n + pre], signed
  readonly tauM: Float32Array;
  readonly tauS: Float32Array;
  readonly V: Float32Array;
  readonly Isyn: Float32Array;
  readonly cool: Int32Array;
  readonly params: LifParams;
  lastCounts: Float32Array;

  constructor(
    n: number,
    W: Float32Array,
    tauM: Float32Array,
    tauS: Float32Array,
    params: LifParams = DEFAULT_LIF,
  ) {
    this.n = n;
    this.W = W;
    this.tauM = tauM;
    this.tauS = tauS;
    this.params = params;
    this.V = new Float32Array(n);
    this.Isyn = new Float32Array(n);
    this.cool = new Int32Array(n);
    this.lastCounts = new Float32Array(n);
  }

  reset(): void {
    this.V.fill(0);
    this.Isyn.fill(0);
    this.cool.fill(0);
    this.lastCounts.fill(0);
  }

  /**
   * Advance `steps` substeps with a constant external current vector `Iext`.
   * Returns per-neuron spike counts over the window.
   */
  step(Iext: Float32Array, steps: number): Float32Array {
    const { n, W, tauM, tauS, V, Isyn, cool, params } = this;
    const { dt, gain, vTh } = params;
    const refSteps = Math.max(1, Math.round(params.tRef / dt));
    const counts = new Float32Array(n);
    const Wsc = gain; // applied when adding W @ fired

    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < n; i++) {
        Isyn[i] += (-Isyn[i] / tauS[i]) * dt;
        if (cool[i] === 0) {
          V[i] += ((-V[i] + Isyn[i] + Iext[i]) / tauM[i]) * dt;
        }
      }

      // collect firings then add synaptic current (vectorized-enough for N~20)
      const fired: number[] = [];
      for (let i = 0; i < n; i++) {
        if (cool[i] === 0 && V[i] >= vTh) {
          fired.push(i);
          counts[i] += 1;
          V[i] = 0;
          cool[i] = refSteps;
        } else if (cool[i] > 0) {
          cool[i] -= 1;
        }
      }

      if (fired.length) {
        for (let post = 0; post < n; post++) {
          let add = 0;
          for (const pre of fired) add += W[post * n + pre];
          Isyn[post] += add * Wsc;
        }
      }
    }

    this.lastCounts = counts;
    return counts;
  }
}

export function ratesHz(counts: Float32Array, steps: number, dtMs: number): Float32Array {
  const windowS = (steps * dtMs) / 1000;
  const out = new Float32Array(counts.length);
  if (windowS <= 0) return out;
  for (let i = 0; i < counts.length; i++) out[i] = counts[i] / windowS;
  return out;
}
