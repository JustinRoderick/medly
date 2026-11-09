import { Schema } from "effect";

export class BackendUnavailable extends Schema.TaggedError<
  BackendUnavailable,
  { readonly brand: unique symbol }
>()("BackendUnavailable", {
  cause: Schema.Defect(),
  reason: Schema.String,
}) {
  override get message(): string {
    return `${this.reason}. The Website forwards /rpc to the RpcBackend service binding. Fix: check the \`BACKEND\` binding in \`apps/web/src/website.ts\`.`;
  }
}
