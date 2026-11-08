import * as Cloudflare from "@alchemy.run/cloudflare";

export const medlyStateStoreName = "alchemy-state-store-medly";

export const medlyState = (state = Cloudflare.state) =>
  state({ workerName: medlyStateStoreName });
