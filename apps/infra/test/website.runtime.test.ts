import { fileURLToPath } from "node:url";

import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Test from "@alchemy.run/test/Vitest";
import { expect } from "@effect/vitest";
import RpcBackend from "@medly/api/rpc-worker";
import { toRpcGroup } from "@medly/capability/rpc-group";
import { NoteText, contracts } from "@medly/core/contracts";
import { Effect, Schema } from "effect";
import { RpcClient, RpcSerialization } from "effect/rpc";

const { test } = Test.make({
  dev: true,
  providers: Cloudflare.providers(),
  sidecar: false,
  stage: `website_runtime_${process.pid}`,
});

const { group } = toRpcGroup(contracts);

const BuiltWebsiteHandler = Cloudflare.Worker("BuiltWebsiteHandler", {
  env: { BACKEND: RpcBackend },
  main: fileURLToPath(
    new URL("../../web/dist/server/fetch.js", import.meta.url)
  ),
});

const text = Schema.decodeSync(NoteText)("saved through the Website");

const notesThroughWebsite = (origin: string) =>
  Effect.gen(function* callThroughWebsite() {
    const client = yield* RpcClient.make(group);

    yield* client.addNote({ text });

    return yield* client.listNotes({ limit: 5 });
  }).pipe(
    Effect.scoped,
    Effect.provide(
      Test.rpcClientLayer(`${origin}/rpc`, {
        serialization: RpcSerialization.json,
      })
    )
  );

test.provider(
  "the built Website handler renders the notes page and forwards /rpc to the RpcBackend and its D1 database",
  (stack) =>
    Effect.gen(function* websiteRuntime() {
      // @effect-diagnostics-next-line anyUnknownInErrorContext:off -- ScratchStack erases provider errors; the test turns any failure into a defect.
      const website = yield* stack.deploy(BuiltWebsiteHandler);
      const origin = website.url ?? "";

      // @effect-diagnostics-next-line anyUnknownInErrorContext:off -- The readiness probe erases its retry errors; the test turns any failure into a defect.
      const response = yield* Test.getWhenReady(`${origin}/`).pipe(
        Effect.provide(Test.guardedFetchLayer("text/html"))
      );

      expect(yield* response.text).toContain("<title>Medly</title>");

      const listed = yield* notesThroughWebsite(origin);

      expect(listed.notes.map((note) => note.text)).toContain(text);
    }).pipe(Effect.orDie),
  { timeout: 300_000 }
);
