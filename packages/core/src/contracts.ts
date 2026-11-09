import { defineContract } from "@medly/capability/contract";
import { Schema } from "effect";

import { NoteStoreUnavailable } from "./note-store-unavailable.js";
import { Note, NoteLimit, NoteList, NoteText } from "./note.js";

export {
  NOTE_LIST_MAX_LIMIT,
  NOTE_TEXT_MAX_LENGTH,
  Note,
  NoteId,
  NoteLimit,
  NoteList,
  NoteText,
} from "./note.js";

export { NoteStoreUnavailable } from "./note-store-unavailable.js";

export const addNoteContract = defineContract("addNote", {
  description: "Save one note and return it with its id and creation time.",
  failure: NoteStoreUnavailable,
  input: Schema.Struct({ text: NoteText }),
  output: Note,
});

export const listNotesContract = defineContract("listNotes", {
  annotations: { idempotent: true, readOnly: true },
  description: "List the newest notes first, up to `limit`.",
  failure: NoteStoreUnavailable,
  input: Schema.Struct({ limit: NoteLimit }),
  output: NoteList,
});

export const contracts = [addNoteContract, listNotesContract] as const;
