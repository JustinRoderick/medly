import { Buffer } from "node:buffer";

import { foldkit } from "@foldkit/vite-plugin";
import { Cause, Effect, Predicate, Schema } from "effect";
import { defineConfig } from "vite";
import type { Connect, Plugin } from "vite";

type BackendFetch = (request: Request) => Promise<Response>;

const DevBackendModule = Schema.Struct({
  backend: Schema.declare<BackendFetch>((input): input is BackendFetch =>
    Predicate.isFunction(input)
  ),
});

const isRpc = (url: string | undefined) => {
  const { pathname } = new URL(url ?? "/", "http://dev.test");

  return pathname === "/rpc" || pathname.startsWith("/rpc/");
};

// @effect-diagnostics-next-line asyncFunction:off -- Node request bodies are async iterables; this dev-only adapter turns one into a Web Request.
const toRequest = async (incoming: Connect.IncomingMessage) => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of incoming) {
    chunks.push(Schema.decodeUnknownSync(Schema.Uint8Array)(chunk));
  }

  const headers = new Headers();

  for (const [name, value] of Object.entries(incoming.headers)) {
    if (value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const method = incoming.method ?? "GET";

  return new Request(
    `http://${incoming.headers.host ?? "dev.test"}${incoming.url ?? "/"}`,
    {
      body:
        method === "GET" || method === "HEAD"
          ? null
          : Uint8Array.from(Buffer.concat(chunks)),
      headers,
      method,
    }
  );
};

const devBackend = (): Plugin => ({
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use((incoming, outgoing, next) => {
      if (!isRpc(incoming.url)) {
        next();

        return;
      }

      const respond = Effect.gen(function* respond() {
        const { backend } = yield* Effect.tryPromise(() =>
          server.ssrLoadModule("#backend")
        ).pipe(Effect.flatMap(Schema.decodeUnknownEffect(DevBackendModule)));

        const request = yield* Effect.tryPromise(() => toRequest(incoming));
        const response = yield* Effect.tryPromise(() => backend(request));
        const body = yield* Effect.tryPromise(() => response.arrayBuffer());

        outgoing.writeHead(
          response.status,
          Object.fromEntries(response.headers)
        );
        outgoing.end(new Uint8Array(body));
      });

      Effect.runFork(
        respond.pipe(
          Effect.catchCause((cause) =>
            Effect.sync(() => {
              next(Cause.squash(cause));
            })
          )
        )
      );
    });
  },
  name: "medly-dev-backend",
});

export default defineConfig({
  build: {
    rolldownOptions: { external: [/^cloudflare:/u] },
  },
  plugins: [
    devBackend(),
    foldkit({
      ssr: {
        build: { prerender: true },
        clientEntry: "/src/client/entry.ts",
        serverEntry: "/src/entry.server.ts",
      },
    }),
  ],
});
