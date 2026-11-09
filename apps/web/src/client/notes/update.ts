import { NOTE_TEXT_MAX_LENGTH, NoteText } from "@medly/core/contracts";
import { Option, Schema } from "effect";
import type { Update } from "foldkit";

import { AddNote, ListNotes, NOTES_SHOWN } from "./command.js";
import { Message } from "./message.js";
import type { NotesMessage } from "./message.js";
import { NotesState, Submission, initialModel } from "./model.js";
import type { NotesModel } from "./model.js";
import type { NoteRpc } from "./note-rpc.js";

type NotesReturn = Update.Return<NotesModel, NotesMessage, NoteRpc>;

const parseDraft = Schema.decodeUnknownOption(NoteText);

const draftProblem = `Write between 1 and ${NOTE_TEXT_MAX_LENGTH} characters.`;

export const acceptsDraft = (model: NotesModel): boolean =>
  !Schema.is(Submission.Saving)(model.submission) &&
  !Schema.is(NotesState.Loading)(model.notes);

export const init = (): NotesReturn => ({
  commands: [ListNotes()],
  model: initialModel,
});

const submit = (model: NotesModel): NotesReturn =>
  Option.match(parseDraft(model.draft.trim()), {
    onNone: () => ({
      model: {
        ...model,
        submission: Submission.Rejected({ message: draftProblem }),
      },
    }),
    onSome: (text) => ({
      commands: [AddNote({ text })],
      model: { ...model, submission: Submission.Saving() },
    }),
  });

export const update = (model: NotesModel, message: NotesMessage): NotesReturn =>
  Message.match<NotesReturn>(message, {
    FailedAddNote: ({ message: problem }) => ({
      model: {
        ...model,
        submission: Submission.Rejected({ message: problem }),
      },
    }),
    FailedListNotes: ({ message: problem }) => ({
      model: { ...model, notes: NotesState.Failed({ message: problem }) },
    }),
    SubmittedDraft: () => (acceptsDraft(model) ? submit(model) : { model }),
    SucceededAddNote: ({ note }) => ({
      model: {
        ...model,
        draft: "",
        notes: NotesState.match(model.notes, {
          Failed: () => NotesState.Loaded({ notes: [note] }),
          Loaded: ({ notes }) =>
            NotesState.Loaded({
              notes: [note, ...notes].slice(0, NOTES_SHOWN),
            }),
          Loading: () => model.notes,
        }),
        submission: Submission.Editing(),
      },
    }),
    SucceededListNotes: ({ notes }) => ({
      model: { ...model, notes: NotesState.Loaded({ notes }) },
    }),
    UpdatedDraft: ({ value }) =>
      Submission.match<NotesReturn>(model.submission, {
        Editing: () => ({ model: { ...model, draft: value } }),
        Rejected: () => ({
          model: { ...model, draft: value, submission: Submission.Editing() },
        }),
        Saving: () => ({ model }),
      }),
  });
