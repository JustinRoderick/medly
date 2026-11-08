import { toRpc } from "@medly/capability/rpc";
import { NoteStore, capabilities } from "@medly/core";
import { Layer } from "effect";
import * as SecureRandom from "effect/crypto/SecureRandom";
import { HttpRouter } from "effect/http";
import { RpcSerialization, RpcServer } from "effect/rpc";

const projection = toRpc(capabilities);

const { handler } = HttpRouter.toWebHandler(
  RpcServer.layerHttp({
    group: projection.group,
    path: "/rpc",
    protocol: "http",
  }).pipe(
    Layer.provideMerge(projection.layer),
    Layer.provide([
      RpcSerialization.layerJson,
      NoteStore.memory,
      SecureRandom.layerWebCrypto,
    ])
  ),
  { disableLogger: true }
);

export const backend = (request: Request): Promise<Response> =>
  handler(request);
