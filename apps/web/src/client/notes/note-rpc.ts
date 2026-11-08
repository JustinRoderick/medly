import { toRpcGroup } from "@medly/capability/rpc-group";
import { contracts } from "@medly/core/contracts";
import { Context, Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { RpcClient, RpcSerialization } from "effect/rpc";

const { group } = toRpcGroup(contracts);

const protocol = RpcClient.layerProtocolHttp({ url: "/rpc" }).pipe(
  Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson])
);

const make = RpcClient.make(group).pipe(Effect.provide(protocol));

export class NoteRpc extends Context.Service<
  NoteRpc,
  Effect.Success<typeof make>
>()("@medly/web/NoteRpc", { make }) {
  static readonly layer = Layer.effect(this, this.make);
}
