# Vision

Medly is built as one typed program: the app, its API, and its cloud live in one TypeScript workspace, and the compiler checks how they fit together. Effect owns the hard parts, Alchemy declares the infrastructure from the code that uses it, Foldkit draws the UI from one Model, and Cloudflare runs it.

The product vision is not written yet. Replace this paragraph with what Medly is for, who uses it, and what it will not do. Keep the engineering intent below unless the thesis is wrong.

## How we build

- New work takes one path: a shared contract, a port named for the job, an adapter in a cartridge, and an outcome a test or a person can observe.
- The easy path is the right path. Corrections live as high on the ladder as they can: the code and types first, then lint and CI, then these documents.
- Debt only shrinks. Lint and type exemptions get retired, never added without a written reason.
- Behavior is proven against the real platform where fakes differ. Worker and D1 code runs under workerd in tests.
- Every package is a cartridge: labeled for one job, added with one line, removed with one deletion, and the gate still passes.

## Decision boundaries

- Safe by default: changes that keep the fence enforceable, keep every cartridge removable, and keep `pnpm turbo run check test build` green.
- Needs owner sign-off: new product promises, toolchain swaps, loosening the fence, and any deploy that replaces or deletes a resource.
