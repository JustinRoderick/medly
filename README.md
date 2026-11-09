# Medly

Medly is one typed program for the app and its cloud, built on the CAFE stack: **C**loudflare runs it, **A**lchemy declares it, **F**oldkit draws the UI, and **E**ffect does the typed work. The structure and the fence follow [rat-stack](https://ratstack.sh). `AGENTS.md` is the repo law, and `VISION.md` says what the project is for.

The starter feature is a small notes app: write a note, see the newest notes first. It exists to show one capability end to end. Replace it with Medly's first real capability (see "Make it yours").

## Run it

Node `24.18.0` or newer and pnpm `11.3.0` are required (`.nvmrc`, `engines`, `packageManager`).

```sh
corepack enable
pnpm install
pnpm turbo run check test build
pnpm dev
```

`pnpm dev` serves the app at `http://localhost:5173` with an in-process backend and an in-memory store, so it needs no Cloudflare account.

## How a note travels

```text
features/notes/view.ts      thin view: reads the Model, sends Messages
client/notes/update.ts      Message → Model, plus named Commands
client/notes/command.ts     AddNote / ListNotes call an RpcClient
        │  POST /rpc  (Effect RPC, schemas from @medly/core/contracts)
        ▼
web: entry.server.ts        renders pages, forwards /rpc to BACKEND
        │  service binding
        ▼
api: RpcBackend             toRpc(capabilities) on a private Worker
core: addNote / listNotes   handlers over the NoteStore port
notes-d1: d1NoteStore       NoteStore on the Notes D1 database
```

Each surface is a projection of the contracts in `packages/core/src/contracts.ts`. Input, output, and failure are Effect Schemas, so the browser, the Worker, and D1 rows are all parsed at their boundary.

## Workspace

- `packages/capability`: `defineContract`, `implement`, and the RPC projections
- `packages/core`: note schemas, contracts, the `NoteStore` port, and handlers
- `packages/notes-d1`: the D1 cartridge, with its database, migrations, and `NoteStore` adapter
- `apps/api`: `RpcBackend`, the private RPC Worker
- `apps/web`: the Foldkit app and its `Website` resource
- `apps/infra`: the Alchemy Stack
- `scripts/` and `tools/oxlint/`: the fence (lint plugins, hook policy, and their tests)

## Commands

- `pnpm check`: lockfile, env schema, strict typecheck, fence tests, lint, format
- `pnpm test`: every test suite, including Worker and D1 tests under local workerd
- `pnpm build`: package outputs and the web build
- `pnpm fix`: format and apply safe lint fixes
- `pnpm vendor:agent-sources`: clone Effect, Alchemy, and Foldkit sources at the pinned versions for source-first agent work
- `pnpm infra:plan`, `pnpm infra:deploy`, `pnpm infra:destroy`: plan, apply, or tear down the Stack

## What it promises and how to check

- One contract drives every surface. Proof: `packages/capability/test/to-rpc.test.ts`.
- The domain rules hold for any input. Proof: `packages/core/test/note.test.ts` and the model test `packages/core/test/notes.model.test.ts`.
- The Worker stores notes in D1 and lists them newest first. Proof: `apps/api/test/rpc-worker.runtime.test.ts`, under local workerd.
- The built Website renders the page and forwards `/rpc` to the backend. Proof: `apps/infra/test/website.runtime.test.ts`, under local workerd.
- The Stack compiles without touching the cloud, and every resource has a provider. Proof: `apps/infra/test/stack.test.ts`.
- The browser program saves, rejects, and recovers as specified. Proof: `apps/web/test/notes.story.test.ts`.
- No storage, handler, or dev code ships in the web bundles. Proof: `apps/web/test/production-bundle.test.ts`.
- The fence rejects boundary violations and hook bypasses. Proof: `scripts/test/boundaries.test.ts` and `scripts/test/vcs-command-policy.test.ts`.

## Deploy

Configure credentials once, then plan before you apply:

```sh
pnpm alchemy profile edit --add Cloudflare
pnpm infra:plan --stage <stage>
pnpm infra:deploy --stage <stage>
```

The Stack keeps its state in a Cloudflare state store Worker named `alchemy-state-store-medly` (`apps/infra/src/state-store.ts`). D1 migrations in `packages/notes-d1/migrations/` apply on deploy.

## Make it yours

1. Write Medly's product rules into `VISION.md` and the "Project law" section of `AGENTS.md`.
2. Replace the notes capability. Add contracts in `packages/core/src/contracts.ts`, handlers beside them, and add them to `capabilities`. Keep the same path: port in core, adapter in a cartridge, Command in the client.
3. Delete what the new feature does not use, following "Keep or cut".
4. Run `pnpm turbo run check test build`.

## Keep or cut

- **Remove the notes starter.** Delete `packages/notes-d1`, `apps/web/src/client/notes`, `apps/web/src/features/notes`, the note modules in `packages/core/src` and their tests, and `apps/api/test/rpc-worker.runtime.test.ts`. Remove `@medly/notes-d1` from `apps/api/package.json` and the `d1NoteStore` provide in `apps/api/src/rpc-worker.ts`. Update the expected resource list in `apps/infra/test/stack.test.ts`. Then `pnpm install` and the gate.
- **Swap the store vendor.** Write another cartridge that provides `NoteStore` (for example KV or Hyperdrive Postgres) and change the one provide line in `apps/api/src/rpc-worker.ts`. Core and the web app do not change.
- **Add another surface.** HTTP with OpenAPI, MCP, CLI, and sandboxed code mode are further projections in rat-stack's `packages/capability`. Copy the projection and its tests, keep `medly-boundaries/no-hand-rolled-surface` passing, and record the source in `PROVENANCE.md`.
- **Add a lifecycle.** When work gains states, retries, or cancellation, add XState `6.0.0-beta.1` and `@xstate/effect` `1.0.0-beta.0` with rat-stack's `add-a-lifecycle-machine` skill.
