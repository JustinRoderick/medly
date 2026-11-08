import { describe, expect, expectTypeOf, it } from "@effect/vitest";
import { Context, Effect, Layer, Result, Schema } from "effect";
import { HttpRouter } from "effect/http";
import { RpcSerialization, RpcServer, RpcTest } from "effect/rpc";

import { defineContract, implement } from "../src/index.js";
import type { RequirementsOf } from "../src/index.js";
import { toRpc, toRpcGroup } from "../src/rpc.js";
import { Refused } from "./refused.js";

const repeatContract = defineContract("repeat", {
  description: "Repeat a word, refusing the word `no`.",
  failure: Refused,
  input: Schema.Struct({ times: Schema.Int, word: Schema.String }),
  output: Schema.Struct({ text: Schema.String }),
});

const repeat = implement(repeatContract, ({ times, word }) =>
  word === "no"
    ? Effect.fail(new Refused({ word }))
    : Effect.succeed({ text: word.repeat(times) })
);

const projection = toRpc([repeat]);

type LayerRequirements<Value> =
  Value extends Layer.Layer<never, unknown, infer Requirements>
    ? Requirements
    : never;

class Greeting extends Context.Service<Greeting, { readonly word: string }>()(
  "test/Greeting"
) {}

const greet = implement(
  defineContract("greet", {
    description: "Greet with the configured word.",
    failure: Schema.Never,
    input: Schema.Struct({}),
    output: Schema.String,
  }),
  () => Greeting.use(({ word }) => Effect.succeed(word))
);

const RpcRequest = Schema.TaggedStruct("Request", {
  headers: Schema.Array(Schema.Tuple([Schema.String, Schema.String])),
  id: Schema.String,
  payload: Schema.Struct({ name: Schema.Finite }),
  tag: Schema.String,
});

describe("toRpc", () => {
  it("keeps every handler requirement on the server layer", () => {
    expectTypeOf<
      RequirementsOf<readonly [typeof greet]>
    >().toEqualTypeOf<Greeting>();
    expectTypeOf<
      LayerRequirements<
        ReturnType<
          typeof toRpc<readonly [typeof repeat, typeof greet]>
        >["layer"]
      >
    >().toEqualTypeOf<Greeting>();
  });

  it("derives the browser client group from contracts alone", () => {
    const { group } = toRpcGroup([repeatContract]);
    const rpc = group.requests.get("repeat");

    expect([...group.requests.keys()]).toStrictEqual(["repeat"]);
    expect(rpc?.payloadSchema).toBe(repeatContract.input);
    expect(rpc?.successSchema).toBe(repeatContract.output);
    expect(rpc?.errorSchema).toBe(repeatContract.failure);
  });

  it.effect.prop(
    "returns the handler's decoded output for any input",
    {
      times: Schema.Int.check(Schema.isBetween({ maximum: 5, minimum: 0 })),
      word: Schema.Union([
        Schema.Literal("no"),
        Schema.String.check(Schema.isMaxLength(8)),
      ]),
    },
    ({ times, word }) =>
      Effect.gen(function* roundTrip() {
        const client = yield* RpcTest.makeClient(projection.group).pipe(
          Effect.provide(projection.layer)
        );

        const result = yield* client
          .repeat({ times, word })
          .pipe(Effect.result);

        expect(result).toStrictEqual(
          word === "no"
            ? Result.fail(new Refused({ word }))
            : Result.succeed({ text: word.repeat(times) })
        );
      })
  );

  it.effect("rejects an invalid payload before the handler runs", () =>
    Effect.gen(function* invalidPayload() {
      let handlerRuns = 0;

      const strict = implement(
        defineContract("strict", {
          description: "Accept a string name.",
          failure: Schema.Never,
          input: Schema.Struct({ name: Schema.String }),
          output: Schema.Struct({ name: Schema.String }),
        }),
        ({ name }) =>
          Effect.sync(() => {
            handlerRuns += 1;

            return { name };
          })
      );

      const strictProjection = toRpc([strict]);

      const { dispose, handler } = HttpRouter.toWebHandler(
        RpcServer.layerHttp({
          group: strictProjection.group,
          path: "/rpc",
          protocol: "http",
        }).pipe(
          Layer.provideMerge(strictProjection.layer),
          Layer.provide(RpcSerialization.layerJson)
        ),
        { disableLogger: true }
      );

      yield* Effect.addFinalizer(() => Effect.promise(dispose));

      const response = yield* Effect.promise(() =>
        handler(
          new Request("http://localhost/rpc", {
            body: JSON.stringify(
              RpcRequest.make({
                headers: [],
                id: "invalid-payload",
                payload: { name: 42 },
                tag: "strict",
              })
            ),
            headers: { "content-type": "application/json" },
            method: "POST",
          })
        )
      );

      const body = yield* Effect.promise(() => response.text());

      expect(handlerRuns).toBe(0);
      expect(body).toContain('"_tag":"Failure"');
    })
  );
});
