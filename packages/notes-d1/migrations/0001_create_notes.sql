CREATE TABLE notes (
  id TEXT PRIMARY KEY NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX notes_newest_first ON notes (created_at DESC, id DESC);
