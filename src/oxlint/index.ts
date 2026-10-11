// @concertypin/config/oxlint — Shared base Oxlint ruleset
// Based on the 6-way intersection of non-Svelte template aggregators,
// with shared project rules added on top.
// Includes cross-template file-pattern exceptions.

import type { OxlintConfig } from "oxlint";

import { javascriptRules, styleRules, typescriptRules } from "./rules.ts";

/**
 * Base plugins, shared rule groups, and file-specific exceptions.
 * `env` and `ignorePatterns` apply only when this is the root config:
 * Oxlint does not inherit them through `extends`.
 */
const defaults: OxlintConfig = {
    options: {
        typeAware: true,
        typeCheck: true,
        denyWarnings: true,
        reportUnusedDisableDirectives: "error",
    },
    plugins: ["unicorn", "typescript", "oxc", "import", "vitest", "promise"],
    env: { builtin: true },
    ignorePatterns: [
        "**/node_modules/**",
        "**/dist/**",
        "**/dist-ts/**",
        "**/coverage/**",
        "**/.cache/**",
        "**/.vscode/**",
        "**/.git/**",
    ],
    rules: {
        ...typescriptRules,
        ...javascriptRules,
        ...styleRules,
    },
    overrides: [
        {
            files: ["tests/**/*"],
            rules: {
                "typescript/no-unsafe-argument": "off",
                "typescript/no-unsafe-assignment": "off",
                "typescript/no-unsafe-call": "off",
                "typescript/no-unsafe-member-access": "off",
                "typescript/no-unsafe-return": "off",
                "typescript/no-unsafe-unary-minus": "off",
            },
        },
        {
            // Declarations describe external or generated shapes:
            // `any` models untyped APIs, and empty interfaces merge declarations.
            files: ["**/*.d.ts"],
            rules: {
                "no-unused-vars": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-empty-object-type": "off",
            },
        },
        {
            files: ["src/**/*", "tests/**/*"],
            rules: {
                "import/no-relative-parent-imports": "error",
            },
        },
        {
            files: ["scripts/**/*.ts"],
            rules: {
                "no-console": "off",
            },
        },
    ],
};

/**
 * Creates the shared base Oxlint configuration.
 * @returns A deep copy that callers can customize without affecting other calls.
 */
export default function createOxlintConfig(): OxlintConfig {
    return structuredClone(defaults);
}
