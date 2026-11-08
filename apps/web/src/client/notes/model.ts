import { Note } from "@medly/core/contracts";
import { Schema } from "effect";
import { defineTaggedUnion } from "foldkit/schema";

export const NotesState = defineTaggedUnion({
  Failed: { message: Schema.String },
  Loaded: { notes: Schema.Array(Note) },
  Loading: {},
});

export const Submission = defineTaggedUnion({
  Editing: {},
  Rejected: { message: Schema.String },
  Saving: {},
});

export const Model = Schema.Struct({
  draft: Schema.String,
  notes: NotesState,
  submission: Submission,
});

export type NotesModel = typeof Model.Type;

export const initialModel: NotesModel = {
  draft: "",
  notes: NotesState.Loading(),
  submission: Submission.Editing(),
};
