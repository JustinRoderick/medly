import { Schema } from "effect";

export const NOTE_TEXT_MAX_LENGTH = 280;

export const NOTE_LIST_MAX_LIMIT = 50;

export const NoteId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("NoteId")
);

export const NoteText = Schema.Trimmed.check(
  Schema.isNonEmpty(),
  Schema.isMaxLength(NOTE_TEXT_MAX_LENGTH)
).pipe(Schema.brand("NoteText"));

export const NoteLimit = Schema.Int.check(
  Schema.isBetween({ maximum: NOTE_LIST_MAX_LIMIT, minimum: 1 })
);

export const Note = Schema.Struct({
  createdAt: Schema.DateTimeUtcFromMillis,
  id: NoteId,
  text: NoteText,
});

export const NoteList = Schema.Struct({ notes: Schema.Array(Note) });
