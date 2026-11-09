import { describe, expect, it } from "vitest";

import {
  HOOK_BYPASS_REASON,
  applyCommandPolicy,
} from "../vcs-command-policy.js";

const bypass = ["--no", "verify"].join("-");

describe("vcs command policy", () => {
  it.each([
    `git commit ${bypass} -m wip`,
    `git push ${bypass}`,
    `cd apps && /usr/bin/git commit -m x ${bypass}`,
  ])("blocks the hook bypass in `%s`", (command) => {
    expect(applyCommandPolicy(command)).toStrictEqual({
      action: "block",
      reason: HOOK_BYPASS_REASON,
    });
  });

  it.each(["git commit -m 'feat: x'", "pnpm check", `echo ${bypass}`])(
    "allows `%s`",
    (command) => {
      expect(applyCommandPolicy(command)).toMatchObject({ action: "allow" });
    }
  );
});
