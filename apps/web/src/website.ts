import * as Cloudflare from "@alchemy.run/cloudflare";
import RpcBackend from "@medly/api/rpc-worker";

export class Website extends Cloudflare.Website.Foldkit<Website>()("Website", {
  assets: { runWorkerFirst: ["/rpc", "/rpc/*"] },
  env: { BACKEND: RpcBackend },
  rootDir: "../web",
}) {}
