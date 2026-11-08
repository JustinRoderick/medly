import { Effect } from "effect";
import {
  Rendered,
  Responded,
  renderToString,
} from "foldkit/experimental/server";

import { init } from "./client/notes/update.js";
import { view } from "./features/notes/view.js";
import { Backend } from "./server/backend.js";

export const prerenderPaths = ["/"];

export { renderDocument } from "foldkit/experimental/server";

const isRpc = (pathname: string) =>
  pathname === "/rpc" || pathname.startsWith("/rpc/");

const handle = Effect.fn("web.handle")(function* handle(request: Request) {
  const { pathname } = new URL(request.url);

  if (isRpc(pathname)) {
    const backend = yield* Backend;

    return Responded(yield* backend.forward(request));
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return Responded(
      new Response("Pages accept GET or HEAD", {
        headers: { Allow: "GET, HEAD" },
        status: 405,
      })
    );
  }

  if (pathname !== "/") {
    return Responded(new Response("Not found", { status: 404 }));
  }

  return Rendered(yield* renderToString({ init, view }));
});

export const renderPage = (request: Request) =>
  Effect.runPromise(handle(request).pipe(Effect.provide(Backend.layer)));
