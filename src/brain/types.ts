/** Named cells in the reduced 2-hop subcircuit (not the full ~138k FlyWire brain). */
export type NeuronName =
  | "GRN_sugar"
  | "JO_ground"
  | "LC4"
  | "LPLC2"
  | "L1_gap"
  | "L1_wall"
  | "JO_fall"
  | "T4_progress"
  | "IN_walk"
  | "IN_threat"
  | "IN_jump_AND"
  | "IN_hold"
  | "IN_gaba_air"
  | "IN_steer_R"
  | "DNp09_L"
  | "DNp09_R"
  | "DNa02_L"
  | "DNa02_R"
  | "MDN"
  | "DNp01_L"
  | "DNp01_R";

export type NeuronLayer = "sensory" | "interneuron" | "descending";

export type Transmitter = "ACh" | "GABA" | "Glu";

export interface NeuronSpec {
  name: NeuronName;
  layer: NeuronLayer;
  nt: Transmitter;
  /** FlyWire v783 root IDs when this cell is a named type in the public atlas. */
  flywireIds: number[];
  role: string;
  roleCn: string;
}

export interface SynapseSpec {
  pre: NeuronName;
  post: NeuronName;
  /** Unsigned synapse count; sign comes from the presynaptic transmitter. */
  w: number;
}

export interface CircuitData {
  neurons: NeuronSpec[];
  synapses: SynapseSpec[];
  notes: string[];
}

export interface StimulusCurrents {
  currents: Partial<Record<NeuronName, number>>;
  channels: Record<string, number>;
}

export interface SpikeSnapshot {
  counts: Float32Array;
  ratesHz: Float32Array;
  voltage: Float32Array;
}

export interface MotorCommand {
  left: boolean;
  right: boolean;
  jump: boolean;
  /** Linear DN readout used to threshold actions (not an LLM policy). */
  dn: {
    walk: number;
    left: number;
    right: number;
    jump: number;
  };
}
