import { Context, Effect, Layer, Predicate, Schema } from "effect";

import { BackendUnavailable } from "./backend-unavailable.js";

const WebsiteEnvironment = Schema.Struct({
  BACKEND: Schema.declare<{
    readonly fetch: (request: Request) => Promise<Response>;
  }>(
    (
      input
    ): input is { readonly fetch: (request: Request) => Promise<Response> } =>
      Predicate.isObject(input) &&
      Predicate.hasProperty(input, "fetch") &&
      Predicate.isFunction(input.fetch)
  ),
});

const bindings = Effect.tryPromise({
  catch: (cause) =>
    new BackendUnavailable({
      cause,
      reason: "The Cloudflare Worker runtime is not available",
    }),
  try: () => import("cloudflare:workers"),
}).pipe(
  Effect.flatMap(({ env }) =>
    Schema.decodeUnknownEffect(WebsiteEnvironment)(env).pipe(
      Effect.mapError(
        (cause) =>
          new BackendUnavailable({
            cause,
            reason: "The Website has no BACKEND service binding",
          })
      )
    )
  )
);

export class Backend extends Context.Service<
  Backend,
  {
    readonly forward: (
      request: Request
    ) => Effect.Effect<Response, BackendUnavailable>;
  }
>()("@medly/web/Backend", {
  make: Effect.succeed({
    forward: Effect.fn("Backend.forward")(function* forward(request: Request) {
      const { BACKEND } = yield* bindings;

      return yield* Effect.tryPromise({
        catch: (cause) =>
          new BackendUnavailable({
            cause,
            reason: "The RpcBackend did not answer",
          }),
        try: () => BACKEND.fetch(request),
      });
    }),
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
