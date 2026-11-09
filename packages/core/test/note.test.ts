import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";

import { NOTE_TEXT_MAX_LENGTH, NoteText } from "../src/index.js";

const acceptsAsNoteText = Schema.is(NoteText);

describe("note text", () => {
  it.prop(
    "is accepted exactly when it is trimmed, non-empty, and within the length limit",
    {
      text: Schema.Union([
        Schema.String,
        Schema.String.check(
          Schema.isMinLength(NOTE_TEXT_MAX_LENGTH - 2),
          Schema.isMaxLength(NOTE_TEXT_MAX_LENGTH + 2)
        ),
      ]),
    },
    ({ text }) => {
      expect(acceptsAsNoteText(text)).toBe(
        text.trim() === text &&
          text.length > 0 &&
          text.length <= NOTE_TEXT_MAX_LENGTH
      );
    }
  );

  it.prop(
    "padding a valid note with whitespace makes it invalid",
    { pad: Schema.Literals([" ", "\n", "\t"]), text: NoteText },
    ({ pad, text }) => {
      expect(acceptsAsNoteText(`${pad}${text}`)).toBe(false);
      expect(acceptsAsNoteText(`${text}${pad}`)).toBe(false);
    }
  );
});
