import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Test from "@alchemy.run/test/Vitest";
import { expect } from "@effect/vitest";
import { NoteText } from "@medly/core";
import { Effect, Schema } from "effect";
import { RpcClient, RpcSerialization } from "effect/rpc";

import RpcBackend, { rpcProjection } from "../src/rpc-worker.js";

const { test } = Test.make({
  dev: true,
  providers: Cloudflare.providers(),
  sidecar: false,
  stage: `api_runtime_${process.pid}`,
});

const texts = ["first note", "second note", "third note"].map((text) =>
  Schema.decodeSync(NoteText)(text)
);

test.provider(
  "the deployed RpcBackend stores notes in D1 and lists them newest first over RPC",
  (stack) =>
    Effect.gen(function* rpcBackendRuntime() {
      // @effect-diagnostics-next-line anyUnknownInErrorContext:off -- ScratchStack erases provider errors; this local runtime-test boundary converts failure to a defect.
      const worker = yield* Effect.orDie(stack.deploy(RpcBackend));

      expect(worker.url, "local dev serves the Worker on a URL").toBeTypeOf(
        "string"
      );

      const notes = yield* Effect.gen(function* callBackend() {
        const client = yield* RpcClient.make(rpcProjection.group);

        for (const text of texts) {
          yield* client.addNote({ text });
        }

        return yield* client.listNotes({ limit: 2 });
      }).pipe(
        Effect.scoped,
        Effect.provide(
          Test.rpcClientLayer(worker.url ?? "", {
            serialization: RpcSerialization.json,
          })
        ),
        Effect.catchTag("NoteStoreUnavailable", Effect.die)
      );

      expect(notes.notes.map((note) => note.text)).toStrictEqual([
        "third note",
        "second note",
      ]);
    }),
  { timeout: 180_000 }
);
