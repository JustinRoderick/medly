import { Context, Effect, Layer, Order, Ref } from "effect";

import type { NoteStoreUnavailable } from "./note-store-unavailable.js";
import type { Note } from "./note.js";

export const newestFirst: Order.Order<typeof Note.Type> = Order.combine(
  Order.mapInput(
    Order.flip(Order.Number),
    (note: typeof Note.Type) => note.createdAt.epochMilliseconds
  ),
  Order.mapInput(Order.flip(Order.String), (note: typeof Note.Type) => note.id)
);

export class NoteStore extends Context.Service<
  NoteStore,
  {
    readonly add: (
      note: typeof Note.Type
    ) => Effect.Effect<void, NoteStoreUnavailable>;
    readonly listNewest: (
      limit: number
    ) => Effect.Effect<readonly (typeof Note.Type)[], NoteStoreUnavailable>;
  }
>()("@medly/core/NoteStore") {
  static readonly memory = Layer.effect(
    this,
    Effect.gen(function* makeMemoryNoteStore() {
      const notes = yield* Ref.make<readonly (typeof Note.Type)[]>([]);

      return NoteStore.of({
        add: (note) => Ref.update(notes, (current) => [...current, note]),
        listNewest: (limit) =>
          Ref.get(notes).pipe(
            Effect.map((current) =>
              current.toSorted(newestFirst).slice(0, limit)
            )
          ),
      });
    })
  );
}
