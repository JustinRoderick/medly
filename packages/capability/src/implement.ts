import { Data } from "effect";
import type { Effect } from "effect";

import type {
  AnyCapability,
  AnyContract,
  Capability,
  FailureOf,
  InputOf,
  OutputOf,
} from "./contract.js";

class CapabilityRecord extends Data.TaggedClass("Capability")<
  Omit<AnyCapability, "_tag">
> {}

export const implement = <
  ContractType extends AnyContract,
  Requirements = never,
>(
  contract: ContractType,
  handler: (
    input: InputOf<ContractType>["Type"]
  ) => Effect.Effect<
    OutputOf<ContractType>["Type"],
    FailureOf<ContractType>["Type"],
    Requirements
  >
): Capability<ContractType, Requirements> => {
  const capability = new CapabilityRecord({ contract, handler });

  // SAFETY: the record stores the same contract and handler the generic signature names; only the heterogeneous record type erases its channels.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The heterogeneous record erases its handler channels until the public generic type is restored.
  return capability as unknown as Capability<ContractType, Requirements>;
};
