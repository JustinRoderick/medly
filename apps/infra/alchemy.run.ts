import * as Cloudflare from "@alchemy.run/cloudflare";
import { Website } from "@medly/web/website";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";

import { medlyState } from "./src/state-store.js";

export default Alchemy.Stack(
  "Medly",
  {
    providers: Cloudflare.providers(),
    state: medlyState(),
  },
  Effect.gen(function* stack() {
    const website = yield* Website;

    return { websiteUrl: website.url };
  })
);
