import { Note } from "@medly/core/contracts";
import { Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";

export const Message = defineMessageUnion({
  FailedAddNote: { message: Schema.String },
  FailedListNotes: { message: Schema.String },
  SubmittedDraft: {},
  SucceededAddNote: { note: Note },
  SucceededListNotes: { notes: Schema.Array(Note) },
  UpdatedDraft: { value: Schema.String },
});

export type NotesMessage = typeof Message.Type;
