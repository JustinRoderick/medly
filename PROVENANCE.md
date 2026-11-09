# Provenance

Borrowed code and where it came from. Each source is MIT licensed; its notice is reproduced below.

## rat-stack

Source: [joelhooks/rat-stack](https://github.com/joelhooks/rat-stack) at commit `2d139ba713fa898ee2d42479d9d3c8e603a5eb8c`.

- `packages/capability/src/contract.ts` and `implement.ts`: trimmed from rat-stack's versions. Medly drops the approval gate, HTTP routes, and the `CallWatch` observer until a surface needs them.
- `packages/capability/src/to-rpc-group.ts` and `to-rpc.ts`: from rat-stack, with failures taken directly from the contract.
- `scripts/oxlint-plugin-boundaries.ts`: from rat-stack, without the events, devtools, and code-snippet rules. `no-devtools-in-production` became `no-dev-in-production`, which keeps only the `src/dev/` folder check.
- `scripts/oxlint-plugin-patterns.ts`: from rat-stack, without the rules for flags, learn snippets, audited content regexes, and XState actor watching.
- `scripts/oxlint-plugin-no-comments.ts`, `scripts/oxlint-plugin-effect-tests.ts`, `scripts/vcs-command-policy.js`, `scripts/hooks/block-git-no-verify.mjs`, `.claude/settings.json`, `tsconfig.base.json`, and `oxfmt.config.ts`: from rat-stack.
- `apps/web/vite.config.ts` dev backend middleware, `apps/web/src/server/backend.ts`, and the Stack offline-compile test follow rat-stack's shapes.

```text
MIT License

Copyright (c) 2026 Joel Hooks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## anti-slop

Source: `tools/oxlint/anti-slop/`, vendored through rat-stack from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop). `tools/oxlint/anti-slop/UPSTREAM.md` records the commit and local changes, and `tools/oxlint/anti-slop/LICENSE` holds its MIT notice.
