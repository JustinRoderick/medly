# Agent instructions

This file is the repo law for agents and contributors. It holds the stack, commands, validation rules, architecture constraints, and stop rules. Read `VISION.md` for intent before substantial work. `VISION.md` does not override this file.

Medly is built on the CAFE stack (Cloudflare, Alchemy, Foldkit, Effect) and follows [rat-stack](https://ratstack.sh): one typed program for the app and its cloud, Effect for the hard parts, Alchemy for the infrastructure, and a fence that makes the easy path the right one. When a question is not answered here, read `https://ratstack.sh/llms.txt` and the matching rat-stack skill before inventing a pattern.

## Stack contract

Workspace `package.json` files declare the pinned stack. Keep every version exact. Record drift instead of silently migrating.

- pnpm workspaces and Turborepo `2.11.9` (`apps/*`, `packages/*`)
- Node `>=24.18.0` and pnpm `11.3.0`; never install with npm or Bun
- Effect `4.1.2` everywhere; every Effect package resolves to one runtime
- Alchemy `2.0.0-beta.85` with `@alchemy.run/cloudflare` for every cloud resource, declared in `apps/infra/alchemy.run.ts` and authenticated through Alchemy profiles, never through env vars in this repo. `@alchemy.run/test` runs Worker runtime tests under local workerd
- Foldkit `0.170.0`, `@foldkit/ui` `0.170.0`, and `@foldkit/vite-plugin` `0.29.0` for the web UI, server-rendered and prerendered
- TypeScript `7.0.2` in strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- `@yielded/effect-tsrs` `0.2.3` runs `typecheck` as `diagnostics --strict --type-check`, so TypeScript errors and every Effect language service diagnostic in `tsconfig.base.json` fail the gate
- `@effect/vitest` `4.1.2` for Effect tests: `it.effect`, `it.prop`, `it.effect.prop`, `it.layer`. Running an Effect by hand in a test file is a lint error
- Oxlint `1.88.0` with Ultracite `8.0.1`, type-aware rules, Oxfmt `0.73.0`, the Foldkit plugin, the vendored anti-slop rules in `tools/oxlint/anti-slop/`, and Medly's own plugins in `scripts/oxlint-plugin-*.ts`
- varlock `1.23.0`: declare every env var in `.env.schema`, keep values in gitignored `.env.local`, run `pnpm env:check` after schema edits

The base Effect plugin config in `tsconfig.base.json` owns diagnostic severity. A package tsconfig may add exact `allowedUnstableApis` for modules it uses. Never set `ignoreEffectWarningsInTscExitCode` to true.

## Packages

- **`@medly/capability`** (`packages/capability`): `defineContract`, `implement`, and the RPC projections `toRpcGroup` (contracts only, browser-safe) and `toRpc` (server handlers). Trimmed from rat-stack; see `PROVENANCE.md`.
- **`@medly/core`** (`packages/core`): domain schemas, contracts, ports, and capability handlers. Starter domain: notes. `@medly/core/contracts` is the browser-safe entry point.
- **`@medly/notes-d1`** (`packages/notes-d1`): the D1 cartridge. Declares the `Notes` D1 database and its migrations, and implements core's `NoteStore` port with it.
- **`@medly/api`** (`apps/api`): `RpcBackend`, a private Cloudflare RPC Worker that serves every capability over Effect RPC with the D1 store.
- **`@medly/web`** (`apps/web`): the Foldkit app. `src/website.ts` declares the `Website` resource (`Cloudflare.Website.Foldkit`) with a `BACKEND` service binding to `RpcBackend`. `src/entry.server.ts` renders pages and forwards `/rpc` to `BACKEND`. `src/dev/backend.ts` serves `/rpc` in process for `pnpm dev` with an in-memory store.
- **`@medly/infra`** (`apps/infra`): the Alchemy Stack, the project's cloud footprint as one Effect program.

## Nouns

- **Contract** (`packages/core/src/contracts.ts`): name, Effect Schema input, output, and failure, plus annotations.
- **Capability** (`packages/core/src/<name>.ts`): binds one contract to a handler with `implement`, then joins `capabilities`.
- **Port** (`packages/core/src/<name>-store.ts` and similar): a `Context.Service` named for an application job. Core owns ports; adapters live in cartridges.
- **Cartridge** (`packages/<name>/`): one job, its implementation, and its cloud resources. Adding it takes one package and one provide line. Removing it takes deleting that package and line, and the gate still passes.
- **Projection** (`packages/capability/src/to-<surface>.ts`): exposes capabilities on one surface. Today that is RPC.
- **Client** (`apps/web/src/client/<name>/`): the Foldkit program's Model, Messages, `update`, and named `Command.define` definitions. Commands call an `RpcClient` built from the contracts' `toRpcGroup`.
- **Feature** (`apps/web/src/features/<name>/`): a thin view that reads the Model and sends Messages.

## Commands

- **`pnpm install`**: install workspace dependencies and the lefthook pre-commit hook
- **`pnpm dev`**: run `apps/web` under `vite dev` with the in-process backend at `http://localhost:5173`
- **`pnpm check`**: lockfile, env schema, strict typecheck of every workspace and root script, fence tests, lint, and format check
- **`pnpm test`**: build what tests need, then run every Vitest suite, including the workerd runtime tests
- **`pnpm build`**: compile packages and build the web app
- **`pnpm fix`**: apply Oxfmt and safe Oxlint fixes. It deletes comments, so move anything a comment knows into a name, a test, or the commit first
- **`pnpm vendor:agent-sources`**: shallow-clone Effect, effect-solutions, Alchemy, and Foldkit at the pinned versions into `.agent_sources/`
- **`pnpm infra:plan`**: preview the Alchemy Stack diff without applying
- **`pnpm infra:deploy` / `pnpm infra:destroy`**: apply or tear down the Stack
- **`pnpm alchemy profile edit --add Cloudflare`**: configure Cloudflare credentials for Alchemy
- **`pnpm turbo run check test build`**: the gate. Run it before claiming a change is ready

## Fence

Prose explains why. The fence enforces. Fence wins over prose.

- Lefthook pre-commit runs `pnpm check` and `pnpm test`. If a hook fails, fix the failure.
- Never pass `--no-verify` or bypass a hook another way. `.claude/settings.json` runs `scripts/hooks/block-git-no-verify.mjs` to refuse it, and `scripts/vcs-command-policy.js` is the policy, tested in `scripts/test/vcs-command-policy.test.ts`.
- `scripts/test/boundaries.test.ts` proves each boundary rule rejects the import it exists to stop.
- Fence messages read `<what>. <why>. Fix: <step>`, and the step names a command, file, or replacement in a code span.

## Source-first Effect work

Before writing or reviewing Effect code, read the installed `node_modules/effect/AGENTS.md`. It ships with the pinned version. Then read source in `.agent_sources/` after `pnpm vendor:agent-sources`. Mirrors are reference material, never runtime dependencies, and stay out of typecheck, lint, and tests.

## Project law

- One contract, every surface. Define schemas and metadata with `defineContract`, bind a handler with `implement`, and add the capability to `capabilities` in `packages/core/src/notes.ts` or its successor. Surfaces are projections in `packages/capability`. Never add a route, RPC, or tool handler that bypasses a capability.
- Schemas are the contract. Input, output, and failure are Effect `Schema`. Parse external data at the boundary where it enters: RPC payloads by the projection, D1 rows by the cartridge, Worker bindings by `apps/web/src/server/backend.ts`.
- Errors are part of the interface. Name the failure with a branded `Schema.TaggedError`, say how to fix it, and fail at the boundary. Users see plain copy chosen in the client Command; operators see the error's message.
- Lifecycles are machines. When work gains finite modes, retries, or cancellation, model it as a state machine instead of booleans. Follow rat-stack's `add-a-lifecycle-machine` skill when that happens; XState is not installed until a lifecycle needs it.
- Infrastructure is code. A resource is declared next to the code that uses it, inside a cartridge Layer, and the Stack only composes. Removing a binding must break the build or a test.
- Prefer property and model tests over example tests. A domain rule is an `it.prop` over Schema-derived inputs. Anything with history is a model checked over generated command sequences, like `packages/core/test/notes.model.test.ts`. Plant a bug before trusting a new property: it must fail.
- Test against the real platform where fakes differ. Worker and D1 behavior is proven under workerd by `apps/api/test/rpc-worker.runtime.test.ts` and `apps/infra/test/website.runtime.test.ts`.
- Tautological tests and change-detector tests are harmful. Do not add a regression test for a bug fix without a genuine gap in behavior testing.
- No comments in code. `no-comments/no-comments` bans them. Two kinds survive: tool directives with the reason after `--`, and a one-line `SAFETY:` invariant above a type assertion. Say everything else in a name, a type, a test, or the commit message.
- Overrides are targeted and explained: `// @effect-diagnostics-next-line <rule>:off -- <reason>` and `// oxlint-disable-next-line <rule> -- <reason>`. A file-level override belongs only at a projection or process boundary.
- Gardener rule: add a lint rule before cleaning up a bad pattern. Exemptions only shrink.
- Pins stay exact. A new fresh pin gets a matching `minimumReleaseAgeExclude` entry in `pnpm-workspace.yaml`.

## Architecture

- Dependency direction: `apps/*` → `packages/notes-d1` → `packages/core` → `packages/capability` → Effect. Packages never import apps. `packages/capability` never imports domain code. Only `apps/infra` composes the Stack. `medly-boundaries/no-cross-layer-imports` enforces this.
- `medly-boundaries/no-core-adapters` keeps provider adapters and HTTP clients out of `packages/core`. Core declares the port; a cartridge implements it; the app provides it at composition (`apps/api/src/rpc-worker.ts`).
- `medly-boundaries/no-browser-server-imports` applies to `apps/*/src/client/**` and `apps/*/src/features/**`. Browser modules may import only `@medly/core/contracts` and `@medly/capability/rpc-group` from workspace packages.
- `medly-boundaries/no-feature-transport` keeps fetch, HTTP, and RPC clients out of features. Transport lives in client Commands.
- `medly-boundaries/no-hand-rolled-surface` keeps `Rpc.make`, `RpcGroup.make`, `HttpApi*`, `Tool.make`, and `Toolkit.make` inside `packages/capability`.
- `medly-boundaries/no-browser-globals-on-server` keeps `window`, `document`, `navigator`, and web storage in browser zones.
- `medly-boundaries/no-dev-in-production` lets only modules inside `apps/<app>/src/dev/` import that folder. `apps/web/test/production-bundle.test.ts` proves no dev backend, store, or handler code reaches the built bundles.
- `medly-patterns`: `contract-binding-matches-name` (`const addNoteContract = defineContract("addNote", …)`), `no-module-level-mutable-state` (module `let` leaks across Worker requests), `acquire-release-constructs-in-acquire-body`, `no-shared-pending-cache`, `shared-waiters`, `no-sleep-in-loop`, and `retain-needs-stage-policy`.
- `apps/api/src/rpc-worker.ts` types its init Effect as needing only Alchemy's Worker runtime services. A capability whose port or service is not provided there fails to compile, and `apps/infra/test/stack.test.ts` fails when a resource binding disappears from the Stack.
- Reference service shape: a `Context.Service` class with the interface in its type and a `static` Layer beside it, like `NoteStore` in `packages/core/src/note-store.ts`.

## Web feature blueprint

One send follows one path: feature view → Message → `update` → named Command → `RpcClient` over the contracts' `toRpcGroup` → `/rpc` on the Website → `BACKEND` service binding → `RpcBackend` → capability handler → `NoteStore` → D1. The server stays authoritative. The Command returns a result Message, and `update` folds it into the Model. Remote state lives in the Model as a tagged union, never as loose booleans.

## Adding a capability

1. Add its schemas and `defineContract` call to `packages/core/src/contracts.ts`, and add the contract to `contracts`.
2. Implement it with `implement` in `packages/core/src/`, and add it to `capabilities`. If it needs storage or a vendor, declare a port in core and implement it in a cartridge.
3. RPC picks it up from `capabilities`. Call it from a named Command in `apps/web/src/client/<name>/`.
4. Add property or model tests for its rule, then run `pnpm turbo run check test build`.

## Worker autonomy ladder

- **Do it**: fix your own red CI, failing hook, or test. Read, edit, and test inside your scope.
- **Do it and report**: commit on your branch, tighten a test, edit docs.
- **Ask the owner**: a choice that changes scope, a guarantee, or the design, where this file does not decide.
- **Owner sign-off**: everything listed below.
- **Never**: hook bypass, merging or deploying as a worker, force-pushing shared branches, secrets or customer data in a PR.

## Boundaries and sign-off

- Safe by default: adding a capability and its tests, tightening a lint rule or test, docs edits, removing a cartridge by its removal steps in `README.md`, and `pnpm infra:plan`.
- Needs owner sign-off: changing any dependency version; any edit that loosens `oxlint.config.ts`, the diagnostics map in `tsconfig.base.json`, `lefthook.yml`, `.claude/settings.json`, or `scripts/vcs-command-policy.js`; `pnpm infra:deploy`; `pnpm infra:destroy` and any deploy whose plan replaces or deletes a resource.
