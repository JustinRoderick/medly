// @effect-diagnostics nodeBuiltinImport:off -- These tests write temporary source fixtures and run the real oxlint binary against them.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");

const oxlint = path.join(repoRoot, "node_modules/.bin/oxlint");

const rules = [
  "no-browser-globals-on-server",
  "no-browser-server-imports",
  "no-core-adapters",
  "no-cross-layer-imports",
  "no-dev-in-production",
  "no-feature-transport",
  "no-hand-rolled-surface",
];

const lint = (file: string, source: string) => {
  const directory = mkdtempSync(path.join(tmpdir(), "medly-boundaries-"));
  const config = path.join(directory, "oxlint.json");
  const fixture = path.join(directory, file);

  mkdirSync(path.dirname(fixture), { recursive: true });
  writeFileSync(
    config,
    JSON.stringify({
      jsPlugins: [
        {
          name: "medly-boundaries",
          specifier: path.join(repoRoot, "scripts/oxlint-plugin-boundaries.ts"),
        },
      ],
      rules: Object.fromEntries(
        rules.map((rule) => [`medly-boundaries/${rule}`, "error"])
      ),
    })
  );
  writeFileSync(fixture, source);

  try {
    const result = spawnSync(oxlint, ["-c", config, "--no-ignore", fixture], {
      cwd: repoRoot,
      encoding: "utf-8",
    });

    return `${result.stdout}${result.stderr}`;
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
};

describe("medly-boundaries", () => {
  it.each([
    [
      "a feature importing a capability handler",
      "apps/web/src/features/notes/fixture.ts",
      'import { addNote } from "@medly/core";\nexport const used = addNote;\n',
      "no-browser-server-imports",
    ],
    [
      "a client importing the Worker runtime",
      "apps/web/src/client/notes/fixture.ts",
      'import { env } from "cloudflare:workers";\nexport const used = env;\n',
      "no-browser-server-imports",
    ],
    [
      "a feature calling fetch",
      "apps/web/src/features/notes/fixture.ts",
      'export const load = () => fetch("/rpc");\n',
      "no-feature-transport",
    ],
    [
      "core importing a Cloudflare adapter",
      "packages/core/src/fixture.ts",
      'import * as Cloudflare from "@alchemy.run/cloudflare";\nexport const used = Cloudflare;\n',
      "no-core-adapters",
    ],
    [
      "the capability package importing domain code",
      "packages/capability/src/fixture.ts",
      'import { contracts } from "@medly/core/contracts";\nexport const used = contracts;\n',
      "no-cross-layer-imports",
    ],
    [
      "a package importing an app",
      "packages/notes-d1/src/fixture.ts",
      'import RpcBackend from "@medly/api/rpc-worker";\nexport const used = RpcBackend;\n',
      "no-cross-layer-imports",
    ],
    [
      "production code importing the dev backend",
      "apps/web/src/entry-fixture.ts",
      'import { backend } from "./dev/backend.js";\nexport const used = backend;\n',
      "no-dev-in-production",
    ],
    [
      "an app building an RPC group by hand",
      "apps/api/src/fixture.ts",
      'import * as RpcGroup from "effect/rpc/RpcGroup";\nexport const group = RpcGroup.make();\n',
      "no-hand-rolled-surface",
    ],
    [
      "server code reading window",
      "apps/api/src/fixture.ts",
      "export const href = window.location.href;\n",
      "no-browser-globals-on-server",
    ],
  ])("rejects %s", (_name, file, source, rule) => {
    expect(lint(file, source)).toContain(`medly-boundaries(${rule})`);
  });

  it.each([
    [
      "a feature importing browser-safe contracts",
      "apps/web/src/features/notes/fixture.ts",
      'import { NoteText } from "@medly/core/contracts";\nexport const used = NoteText;\n',
    ],
    [
      "a client building the RPC client group from contracts",
      "apps/web/src/client/notes/fixture.ts",
      'import { toRpcGroup } from "@medly/capability/rpc-group";\nexport const used = toRpcGroup;\n',
    ],
    [
      "an adapter cartridge importing core and Alchemy",
      "packages/notes-d1/src/fixture.ts",
      'import * as Cloudflare from "@alchemy.run/cloudflare";\nimport { NoteStore } from "@medly/core";\nexport const used = [Cloudflare, NoteStore];\n',
    ],
  ])("accepts %s", (_name, file, source) => {
    expect(lint(file, source)).not.toContain("medly-boundaries(");
  });
});
