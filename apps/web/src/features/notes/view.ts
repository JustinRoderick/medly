import { NOTE_TEXT_MAX_LENGTH } from "@medly/core/contracts";
import type { Note } from "@medly/core/contracts";
import { DateTime } from "effect";
import type { Document, Html, HtmlBuilder } from "foldkit/html";

import { Message } from "../../client/notes/message.js";
import type { NotesMessage } from "../../client/notes/message.js";
import { NotesState, Submission } from "../../client/notes/model.js";
import type { NotesModel } from "../../client/notes/model.js";

const noteItem = (h: HtmlBuilder<NotesMessage>, note: typeof Note.Type): Html =>
  h.keyed("li")(
    note.id,
    [h.Class("note")],
    [
      h.p([], [note.text]),
      h.time(
        [h.Datetime(DateTime.formatIso(note.createdAt))],
        [DateTime.formatIso(note.createdAt)]
      ),
    ]
  );

const noteList = (h: HtmlBuilder<NotesMessage>, model: NotesModel): Html =>
  NotesState.match(model.notes, {
    Failed: ({ message }) => h.p([h.Role("alert")], [message]),
    Loaded: ({ notes }) =>
      notes.length === 0
        ? h.p([h.Class("empty")], ["No notes yet. Write the first one."])
        : h.ul(
            [h.Class("notes")],
            notes.map((note) => noteItem(h, note))
          ),
    Loading: () => h.p([h.AriaLive("polite")], ["Loading notes…"]),
  });

const submissionProblem = (
  h: HtmlBuilder<NotesMessage>,
  model: NotesModel
): Html =>
  h.p(
    [h.Id("draft-problem"), h.Role("alert"), h.Class("problem")],
    Submission.match(model.submission, {
      Editing: () => [],
      Rejected: ({ message }) => [message],
      Saving: () => [],
    })
  );

const draftForm = (h: HtmlBuilder<NotesMessage>, model: NotesModel): Html => {
  const saving = Submission.match(model.submission, {
    Editing: () => false,
    Rejected: () => false,
    Saving: () => true,
  });

  return h.form(
    [h.OnSubmit(Message.SubmittedDraft()), h.Class("draft")],
    [
      h.label([h.For("draft")], ["New note"]),
      h.textarea([
        h.Id("draft"),
        h.Name("draft"),
        h.Value(model.draft),
        h.Maxlength(NOTE_TEXT_MAX_LENGTH),
        h.OnInput((value) => Message.UpdatedDraft({ value })),
        h.AriaDescribedBy("draft-problem"),
      ]),
      submissionProblem(h, model),
      h.button(
        [h.Type("submit"), h.Disabled(saving)],
        [saving ? "Saving…" : "Save note"]
      ),
    ]
  );
};

export const view = (
  model: NotesModel,
  h: HtmlBuilder<NotesMessage>
): Document => ({
  body: h.main(
    [h.Class("page")],
    [h.h1([], ["Medly"]), draftForm(h, model), noteList(h, model)]
  ),
  lang: "en",
  title: "Medly",
});
