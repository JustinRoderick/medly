import { Schema } from "effect";

export class Refused extends Schema.TaggedError<
  Refused,
  { readonly brand: unique symbol }
>()("Refused", { word: Schema.String }) {}
