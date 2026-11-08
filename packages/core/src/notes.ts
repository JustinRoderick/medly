import { implement } from "@medly/capability/implement";
import { DateTime, Effect } from "effect";
import { SecureRandom } from "effect/crypto/SecureRandom";

import { addNoteContract, listNotesContract } from "./contracts.js";
import { NoteStore } from "./note-store.js";
import { NoteId } from "./note.js";

export const addNote = implement(addNoteContract, ({ text }) =>
  Effect.gen(function* addNoteHandler() {
    const store = yield* NoteStore;
    const random = yield* SecureRandom;
    const id = NoteId.make(yield* random.uuidV7());
    const createdAt = yield* DateTime.now;
    const note = { createdAt, id, text };

    yield* store.add(note);

    return note;
  })
);

export const listNotes = implement(listNotesContract, ({ limit }) =>
  NoteStore.use((store) => store.listNewest(limit)).pipe(
    Effect.map((notes) => ({ notes }))
  )
);

export const capabilities = [addNote, listNotes] as const;
