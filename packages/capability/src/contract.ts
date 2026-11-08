import { Data } from "effect";
import type { Effect, Schema } from "effect";

export interface Annotations {
  readonly readOnly: boolean;
  readonly destructive: boolean;
  readonly idempotent: boolean;
  readonly openWorld: boolean;
}

export type PlainSchema = Schema.Top & {
  readonly DecodingServices: never;
  readonly EncodingServices: never;
};

export type InputSchema = Schema.Struct<Record<string, PlainSchema>>;

export interface Contract<
  Name extends string,
  Input extends InputSchema,
  Output extends PlainSchema,
  Failure extends PlainSchema,
> {
  readonly _tag: "Contract";
  readonly name: Name;
  readonly description: string;
  readonly input: Input;
  readonly output: Output;
  readonly failure: Failure;
  readonly annotations: Annotations;
}

export type AnyContract = Contract<
  string,
  InputSchema,
  PlainSchema,
  PlainSchema
>;

export interface Capability<
  ContractType extends AnyContract,
  Requirements = never,
> {
  readonly _tag: "Capability";
  readonly contract: ContractType;
  readonly handler: (
    input: ContractType["input"]["Type"]
  ) => Effect.Effect<
    ContractType["output"]["Type"],
    ContractType["failure"]["Type"],
    Requirements
  >;
}

export interface AnyCapability {
  readonly _tag: "Capability";
  readonly contract: AnyContract;
  readonly handler: (input: never) => Effect.Effect<unknown, unknown, unknown>;
}

export type ContractOf<Value> = Value extends {
  readonly contract: infer ContractType;
}
  ? ContractType
  : Value extends { readonly _tag: "Contract" }
    ? Value
    : never;

export type NameOf<Value> =
  ContractOf<Value> extends {
    readonly name: infer Name extends string;
  }
    ? Name
    : never;

export type InputOf<Value> =
  ContractOf<Value> extends {
    readonly input: infer Input extends InputSchema;
  }
    ? Input
    : never;

export type OutputOf<Value> =
  ContractOf<Value> extends {
    readonly output: infer Output extends PlainSchema;
  }
    ? Output
    : never;

export type FailureOf<Value> =
  ContractOf<Value> extends {
    readonly failure: infer Failure extends PlainSchema;
  }
    ? Failure
    : never;

export type RequirementsOf<Value> = Value extends readonly AnyCapability[]
  ? CapabilityRequirementsOf<Value[number]>
  : CapabilityRequirementsOf<Value>;

type CapabilityRequirementsOf<Value> = Value extends {
  readonly handler: (
    input: never
  ) => Effect.Effect<unknown, unknown, infer Requirements>;
}
  ? Requirements
  : never;

export interface DefineContractOptions<
  Input extends InputSchema,
  Output extends PlainSchema,
  Failure extends PlainSchema,
> {
  readonly description: string;
  readonly input: Input;
  readonly output: Output;
  readonly failure: Failure;
  readonly annotations?: Partial<Annotations> | undefined;
}

const defaultAnnotations: Annotations = {
  destructive: false,
  idempotent: false,
  openWorld: false,
  readOnly: false,
};

class ContractRecord extends Data.TaggedClass("Contract")<
  Omit<AnyContract, "_tag">
> {}

export function defineContract<
  const Name extends string,
  Input extends InputSchema,
  Output extends PlainSchema,
  Failure extends PlainSchema,
>(
  name: Name,
  options: DefineContractOptions<Input, Output, Failure>
): Contract<Name, Input, Output, Failure>;
export function defineContract(
  name: string,
  options: DefineContractOptions<InputSchema, PlainSchema, PlainSchema>
): AnyContract {
  return new ContractRecord({
    annotations: { ...defaultAnnotations, ...options.annotations },
    description: options.description,
    failure: options.failure,
    input: options.input,
    name,
    output: options.output,
  });
}
