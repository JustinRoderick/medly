import * as Cloudflare from "@alchemy.run/cloudflare";
import { toRpc } from "@medly/capability/rpc";
import { NoteStore, capabilities } from "@medly/core";
import { d1NoteStore } from "@medly/notes-d1";
import * as SecureRandom from "effect/crypto/SecureRandom";
import * as Effect from "effect/Effect";
import type { HttpServerRequest } from "effect/http/HttpServerRequest";
import type { HttpServerResponse } from "effect/http/HttpServerResponse";
import * as Layer from "effect/Layer";
import { RpcSerialization, RpcServer } from "effect/rpc";
import type { Scope } from "effect/Scope";

export const rpcProjection = toRpc(capabilities);

type ServeRequest = Effect.Effect<
  Effect.Effect<HttpServerResponse, never, HttpServerRequest | Scope>,
  never,
  Scope
>;

const serve: Effect.Effect<
  ServeRequest,
  never,
  Cloudflare.Providers | Cloudflare.Workers.WorkerServices
> = Effect.gen(function* makeRpcBackend() {
  const store = yield* NoteStore.pipe(Effect.provide(d1NoteStore));

  // @effect-diagnostics-next-line returnEffectInGen:off -- Alchemy's RPC Worker initialization returns its request Effect.
  return RpcServer.toHttpEffect(rpcProjection.group).pipe(
    Effect.provide(
      Layer.mergeAll(rpcProjection.layer, RpcSerialization.layerJson).pipe(
        Layer.provide(
          Layer.mergeAll(
            Layer.succeed(NoteStore, store),
            SecureRandom.layerWebCrypto
          )
        )
      )
    )
  );
});

export default class RpcBackend extends Cloudflare.Workers.RpcWorker<RpcBackend>()(
  "RpcBackend",
  {
    main: import.meta.url,
    schema: rpcProjection.group,
    workersDev: false,
  },
  serve
) {}
