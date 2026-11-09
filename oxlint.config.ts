import foldkitRecommended from "@foldkit/oxlint-plugin/recommended.json" with { type: "json" };
import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

const foldkitScope = (pattern: string) => `apps/web/src/${pattern}`;

const foldkitSeverity = ([rule, severity]: readonly [string, string]) => {
  if (severity === "error" || severity === "off") {
    return [rule, severity] as const;
  }

  throw new Error(
    `@foldkit/oxlint-plugin/recommended.json sets ${rule} to ${severity}. Every fence rule is an error or off. Fix: map that severity in \`oxlint.config.ts\` before bumping the plugin.`
  );
};

const foldkitRules = (rules: Readonly<Record<string, string>>) =>
  Object.fromEntries(Object.entries(rules).map(foldkitSeverity));

const foldkitOverrides = [
  {
    files: [foldkitScope("**/*.ts")],
    rules: foldkitRules(foldkitRecommended.rules),
  },
  ...foldkitRecommended.overrides.map(({ excludeFiles, files, rules }) => ({
    excludeFiles: excludeFiles?.map(foldkitScope),
    files: files.map(foldkitScope),
    rules: foldkitRules(rules),
  })),
];

export default defineConfig({
  extends: [core],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    ".agent_sources/**",
    "**/dist/**",
    "**/.alchemy/**",
    "node_modules/**",
    ".claude/**",
    "scripts/hooks/**",
    "tools/oxlint/anti-slop/**",
  ],
  jsPlugins: [
    { name: "foldkit", specifier: "@foldkit/oxlint-plugin" },
    "./scripts/oxlint-plugin-effect-tests.ts",
    "./scripts/oxlint-plugin-no-comments.ts",
    {
      name: "medly-boundaries",
      specifier: "./scripts/oxlint-plugin-boundaries.ts",
    },
    {
      name: "medly-patterns",
      specifier: "./scripts/oxlint-plugin-patterns.ts",
    },
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
    {
      name: "anti-slop-effect",
      specifier: "./tools/oxlint/anti-slop/effect/index.ts",
    },
  ],
  options: {
    typeAware: true,
  },
  overrides: [
    ...foldkitOverrides,
    {
      files: [
        "**/*.{test,spec,test-d,spec-d}.{mts,cts,mjs,cjs}",
        "**/__tests__/**/*.{mts,cts,mjs,cjs}",
      ],
      rules: {
        "no-empty-function": "error",
        "promise/prefer-await-to-then": "error",
      },
    },
    {
      files: ["apps/*/src/features/**", "apps/*/src/client/**"],
      rules: {
        "medly-boundaries/no-browser-server-imports": "error",
      },
    },
    {
      files: ["apps/*/src/features/**"],
      rules: {
        "medly-boundaries/no-feature-transport": "error",
      },
    },
  ],
  rules: {
    "anti-slop-effect/no-manual-effect-error-tag": "error",
    "anti-slop-effect/no-manual-tag-comparison": "error",
    "anti-slop-effect/no-manual-tagged-construction": "error",
    "anti-slop-effect/no-service-constructor-imports": "error",
    "anti-slop-effect/prefer-effect-match": "error",
    "anti-slop/no-array-filter-map": "error",
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reduce-accumulator-copy": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-runtime-typeof": "error",
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-readable-spacing": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
    "effect-tests/no-manual-effect-runtime-in-tests": "error",
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns-description": "off",
    "medly-boundaries/no-browser-globals-on-server": "error",
    "medly-boundaries/no-core-adapters": "error",
    "medly-boundaries/no-cross-layer-imports": "error",
    "medly-boundaries/no-dev-in-production": "error",
    "medly-boundaries/no-hand-rolled-surface": "error",
    "medly-patterns/acquire-release-constructs-in-acquire-body": "error",
    "medly-patterns/contract-binding-matches-name": "error",
    "medly-patterns/no-module-level-mutable-state": "error",
    "medly-patterns/no-shared-pending-cache": "error",
    "medly-patterns/no-sleep-in-loop": "error",
    "medly-patterns/retain-needs-stage-policy": "error",
    "medly-patterns/shared-waiters": "error",
    "no-comments/directive-reason": "error",
    "no-comments/no-comments": "error",
    "oxc/no-accumulating-spread": "error",
    "typescript/promise-function-async": "off",
    "unicorn/throw-new-error": "off",
  },
});
