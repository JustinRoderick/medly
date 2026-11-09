import { fileURLToPath } from "node:url";

import * as Cloudflare from "@alchemy.run/cloudflare";
import { Note, NoteStore, NoteStoreUnavailable } from "@medly/core";
import * as RuntimeContext from "alchemy/RuntimeContext";
import { Effect, Layer, Schema } from "effect";

export const notesMigrations = fileURLToPath(
  new URL("../migrations/", import.meta.url)
);

export const NotesDatabase = Cloudflare.D1.Database("Notes", {
  migrations: notesMigrations,
});

const NoteRow = Schema.Struct({
  created_at: Note.fields.createdAt,
  id: Note.fields.id,
  text: Note.fields.text,
});

const decodeRows = Schema.decodeUnknownEffect(Schema.Array(NoteRow));

const encodeRow = Schema.encodeEffect(NoteRow);

const unavailable =
  (operation: NoteStoreUnavailable["operation"]) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    effect.pipe(
      Effect.catchDefect(Effect.fail),
      Effect.mapError(() => new NoteStoreUnavailable({ operation })),
      Effect.provide(RuntimeContext.RuntimeContext.phantom)
    );

export const d1NoteStore = Layer.unwrap(
  Effect.gen(function* declareD1NoteStore() {
    const database = yield* NotesDatabase;
    const client = yield* Cloudflare.D1.QueryDatabase(database);

    return Layer.succeed(
      NoteStore,
      NoteStore.of({
        add: (note) =>
          encodeRow({
            created_at: note.createdAt,
            id: note.id,
            text: note.text,
          }).pipe(
            Effect.flatMap((row) =>
              client
                .prepare(
                  "INSERT INTO notes (id, text, created_at) VALUES (?, ?, ?)"
                )
                .bind(row.id, row.text, row.created_at)
                .run()
            ),
            Effect.asVoid,
            unavailable("add")
          ),
        listNewest: (limit) =>
          client
            .prepare(
              "SELECT id, text, created_at FROM notes ORDER BY created_at DESC, id DESC LIMIT ?"
            )
            .bind(limit)
            .all()
            .pipe(
              Effect.flatMap((result) => decodeRows(result.results)),
              Effect.map((rows) =>
                rows.map((row) => ({
                  createdAt: row.created_at,
                  id: row.id,
                  text: row.text,
                }))
              ),
              unavailable("list")
            ),
      })
    );
  })
).pipe(Layer.provide(Cloudflare.D1.QueryDatabaseBinding));
