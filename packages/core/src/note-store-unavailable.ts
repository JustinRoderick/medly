import { Schema } from "effect";

export class NoteStoreUnavailable extends Schema.TaggedError<
  NoteStoreUnavailable,
  { readonly brand: unique symbol }
>()("NoteStoreUnavailable", {
  operation: Schema.Literals(["add", "list"]),
}) {
  override get message(): string {
    return `The note store could not ${this.operation} notes. The storage adapter failed or returned rows that do not match the Note schema. Fix: check the adapter's logs and its migrations under \`packages/notes-d1/migrations\`.`;
  }
}
