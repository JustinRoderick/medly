import { describe, expect, it } from "@effect/vitest";
import { NOTE_TEXT_MAX_LENGTH, NoteId, NoteText } from "@medly/core/contracts";
import { DateTime, Schema } from "effect";
import { Story } from "foldkit/test";

import { AddNote, ListNotes } from "../src/client/notes/command.js";
import { Message } from "../src/client/notes/message.js";
import {
  NotesState,
  Submission,
  initialModel,
} from "../src/client/notes/model.js";
import { init, update } from "../src/client/notes/update.js";

const note = {
  createdAt: DateTime.makeUnsafe(0),
  id: Schema.decodeSync(NoteId)("0190a8d6-3a7c-7cde-8a4b-1c2d3e4f5a6b"),
  text: Schema.decodeSync(NoteText)("write the boilerplate"),
};

const loaded = { ...initialModel, notes: NotesState.Loaded({ notes: [] }) };

describe("notes program", () => {
  it("loads the newest notes when it starts", () => {
    const { commands = [], model } = init();

    expect(model).toStrictEqual(initialModel);
    expect(commands.map((command) => command.name)).toStrictEqual([
      ListNotes.name,
    ]);
  });

  it("saves a valid draft, then shows the saved note first and clears the draft", () => {
    Story.story(
      update,
      Story.given(loaded),
      Story.message(Message.UpdatedDraft({ value: `  ${note.text}  ` })),
      Story.message(Message.SubmittedDraft()),
      Story.Command.expectExact(AddNote({ text: note.text })),
      Story.model((model) => {
        expect(model.submission).toStrictEqual(Submission.Saving());
      }),
      Story.Command.resolve(AddNote, Message.SucceededAddNote({ note })),
      Story.model((model) => {
        expect(model.draft).toBe("");
        expect(model.submission).toStrictEqual(Submission.Editing());
        expect(model.notes).toStrictEqual(NotesState.Loaded({ notes: [note] }));
      })
    );
  });

  it("ignores a second submit while the first save is in flight", () => {
    const saving = {
      ...loaded,
      draft: note.text,
      submission: Submission.Saving(),
    };

    expect(update(saving, Message.SubmittedDraft())).toStrictEqual({
      model: saving,
    });
  });

  it("keeps the draft unchanged while a save is in flight", () => {
    const saving = {
      ...loaded,
      draft: note.text,
      submission: Submission.Saving(),
    };

    expect(
      update(saving, Message.UpdatedDraft({ value: "typed while saving" }))
    ).toStrictEqual({ model: saving });
  });

  it("does not save before the first list arrives", () => {
    const loading = { ...initialModel, draft: note.text };

    expect(update(loading, Message.SubmittedDraft())).toStrictEqual({
      model: loading,
    });
  });

  it("keeps the draft and explains the failure when saving fails", () => {
    Story.story(
      update,
      Story.given(loaded),
      Story.message(Message.UpdatedDraft({ value: note.text })),
      Story.message(Message.SubmittedDraft()),
      Story.Command.resolve(
        AddNote,
        Message.FailedAddNote({ message: "The note was not saved." })
      ),
      Story.model((model) => {
        expect(model.draft).toBe(note.text);
        expect(model.submission).toStrictEqual(
          Submission.Rejected({ message: "The note was not saved." })
        );
      })
    );
  });

  it.prop(
    "a draft that is blank or still too long after trimming is rejected without calling the backend",
    {
      draft: Schema.Union([
        Schema.Literals(["", " ", "\n\t "]),
        Schema.Trimmed.check(Schema.isMinLength(NOTE_TEXT_MAX_LENGTH + 1)),
      ]),
    },
    ({ draft }) => {
      Story.story(
        update,
        Story.given(loaded),
        Story.message(Message.UpdatedDraft({ value: draft })),
        Story.message(Message.SubmittedDraft()),
        Story.Command.expectNone(),
        Story.model((model) => {
          expect(Schema.is(Submission.Rejected)(model.submission)).toBe(true);
        })
      );
    }
  );

  it.prop(
    "a valid note padded with whitespace is saved as the trimmed text",
    { pad: Schema.Literals([" ", "\n", "\t "]), text: NoteText },
    ({ pad, text }) => {
      Story.story(
        update,
        Story.given(loaded),
        Story.message(Message.UpdatedDraft({ value: `${pad}${text}${pad}` })),
        Story.message(Message.SubmittedDraft()),
        Story.Command.expectExact(AddNote({ text })),
        Story.Command.resolve(
          AddNote,
          Message.SucceededAddNote({ note: { ...note, text } })
        )
      );
    }
  );
});
