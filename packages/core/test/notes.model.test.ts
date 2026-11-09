import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Match, Option, Schema } from "effect";
import * as SecureRandom from "effect/crypto/SecureRandom";
import { TestClock } from "effect/testing";

import {
  NOTE_LIST_MAX_LIMIT,
  NoteLimit,
  NoteStore,
  NoteText,
  addNote,
  listNotes,
} from "../src/index.js";

const Step = Schema.Union([
  Schema.TaggedStruct("Add", { text: NoteText }),
  Schema.TaggedStruct("Wait", {
    millis: Schema.Int.check(Schema.isBetween({ maximum: 5000, minimum: 0 })),
  }),
]);

const Steps = Schema.Array(Step).check(Schema.isMaxLength(NOTE_LIST_MAX_LIMIT));

const services = Layer.mergeAll(NoteStore.memory, SecureRandom.layerWebCrypto);

const runSession = (steps: typeof Steps.Type, limit: number) =>
  Effect.gen(function* session() {
    const added: string[] = [];

    for (const step of steps) {
      const id = yield* Match.value(step).pipe(
        Match.tagsExhaustive({
          Add: ({ text }) =>
            addNote
              .handler({ text })
              .pipe(Effect.map((note) => Option.some(note.id))),
          Wait: ({ millis }) =>
            TestClock.adjust(millis).pipe(Effect.as(Option.none<string>())),
        })
      );

      if (Option.isSome(id)) {
        added.push(id.value);
      }
    }

    const { notes } = yield* listNotes.handler({ limit });

    expect(notes.map((note) => note.id)).toStrictEqual(
      added.toReversed().slice(0, limit)
    );
  }).pipe(Effect.provide(services));

describe("notes model", () => {
  it.effect.prop(
    "listNotes returns the newest added notes first, at most limit of them",
    { limit: NoteLimit, steps: Steps },
    ({ limit, steps }) => runSession(steps, limit)
  );
});
