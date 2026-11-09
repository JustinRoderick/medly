import { NoteText } from "@medly/core/contracts";
import { Effect } from "effect";
import { Command } from "foldkit";

import { Message } from "./message.js";
import { NoteRpc } from "./note-rpc.js";

export const NOTES_SHOWN = 20;

export const ListNotes = Command.define("ListNotes", {
  execute: NoteRpc.use((rpc) => rpc.listNotes({ limit: NOTES_SHOWN })).pipe(
    Effect.map(({ notes }) => Message.SucceededListNotes({ notes })),
    Effect.orElseSucceed(() =>
      Message.FailedListNotes({
        message: "Notes could not be loaded. Reload the page to try again.",
      })
    )
  ),
  messages: [Message.SucceededListNotes, Message.FailedListNotes],
});

export const AddNote = Command.define("AddNote", {
  args: { text: NoteText },
  execute: ({ text }) =>
    NoteRpc.use((rpc) => rpc.addNote({ text })).pipe(
      Effect.map((note) => Message.SucceededAddNote({ note })),
      Effect.orElseSucceed(() =>
        Message.FailedAddNote({
          message: "The note was not saved. Try again in a moment.",
        })
      )
    ),
  messages: [Message.SucceededAddNote, Message.FailedAddNote],
});
