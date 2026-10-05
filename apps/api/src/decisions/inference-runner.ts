export interface DecisionInputs {
  ids: readonly number[];
  /** [MASK] position of each option. */
  markers: readonly number[];
  /** MODEL_TYPE_ID of the question kind. */
  typeId: number;
}

/** ezshop's interface over the ONNX runtime: one logit per option marker, in marker order. */
export interface InferenceRunner {
  markerLogits(inputs: DecisionInputs): Promise<number[]>;
}
