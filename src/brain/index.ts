export { LifEngine, DEFAULT_LIF, ratesHz } from "./lif";
export {
  CIRCUIT,
  CIRCUIT_NOTES,
  INDEX,
  NAME_OF,
  NEURONS,
  STEPS_PER_TICK,
  buildWeightMatrix,
  emptyIext,
} from "./circuit";
export { encodeAtlas, currentsToIext, inverseSizeDrive, approachDrive } from "./encoder";
export { MotorPlant, readout } from "./readout";
export type { MotorCommand, NeuronName, SpikeSnapshot, StimulusCurrents } from "./types";
