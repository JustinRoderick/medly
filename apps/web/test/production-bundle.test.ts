// @effect-diagnostics nodeBuiltinImport:off -- This test reads the files `vite build` wrote.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const dist = path.resolve(import.meta.dirname, "../dist");

const filesUnder = (directory: string): string[] =>
  readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(entry.parentPath, entry.name));

const bundle = (directory: string) =>
  filesUnder(path.join(dist, directory))
    .map((file) => readFileSync(file, "utf-8"))
    .join("\n");

describe("production build", () => {
  it.each(["client", "server"])(
    "the %s bundle carries no note storage, handler, or dev backend code",
    (directory) => {
      const code = bundle(directory);

      expect(code.length).toBeGreaterThan(0);
      expect(code).not.toContain("@medly/core/NoteStore");
      expect(code).not.toContain("INSERT INTO notes");
      expect(code).not.toContain("medly-dev-backend");
    }
  );

  it("prerenders the notes page shell", () => {
    const html = readFileSync(path.join(dist, "client/index.html"), "utf-8");

    expect(html).toContain("<title>Medly</title>");
    expect(html).toContain("data-foldkit-app");
  });
});
