import { NodeServices } from "@effect/platform-node";
import { expect, it } from "@effect/vitest";
import { AuthProviders, Stage } from "alchemy";
import { AlchemyContextLive } from "alchemy/AlchemyContext";
import { tryFindProviderRegistrationByType } from "alchemy/Provider";
import { Effect, Layer, Option } from "effect";
import * as HttpClient from "effect/http/HttpClient";

import stack from "../alchemy.run.js";

const offline = Layer.mergeAll(
  AlchemyContextLive.pipe(Layer.provideMerge(NodeServices.layer)),
  Layer.succeed(Stage, "prod"),
  Layer.succeed(AuthProviders, {}),
  Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make(() =>
      Effect.die("compiling the Stack must not call a cloud API")
    )
  )
);

it.effect(
  "the Stack compiles offline and every declared resource has a provider",
  () =>
    Effect.gen(function* compileStack() {
      const compiled = yield* stack.pipe(Effect.provide(offline));
      const resources = Object.values(compiled.resources);

      expect(
        resources.map((resource) => resource.FQN).toSorted()
      ).toStrictEqual(["Notes", "RpcBackend", "Website"]);

      for (const resource of resources) {
        const provider = yield* tryFindProviderRegistrationByType(
          resource.Type
        ).pipe(Effect.provideContext(compiled.services));

        expect(
          Option.isSome(provider),
          `${resource.FQN}: no provider registered for ${resource.Type}`
        ).toBe(true);
      }
    })
);
