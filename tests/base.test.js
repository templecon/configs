import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import createOxlintConfig from "@concertypin/config/oxlint";
import createFrontendOxlintConfig from "@concertypin/config/oxlint/frontend";

const base = createOxlintConfig();
const frontend = createFrontendOxlintConfig({
    tailwind: { entryPoint: "src/index.css" },
});
const frontendWithoutTailwind = createFrontendOxlintConfig({});
// Verify the deprecated signature remains compatible.
// oxlint-disable-next-line typescript/no-deprecated
const legacyFrontend = createFrontendOxlintConfig("legacy.css");

describe("@concertypin/config/oxlint", () => {
    it("exports the shared base rules and rejects deprecated APIs", () => {
        assert.equal(Object.keys(base.rules).length, 105);
        assert.equal(base.rules["no-var"], "error");
        assert.deepEqual(base.rules["eqeqeq"], [
            "warn",
            "always",
            { null: "ignore" },
        ]);
        assert.equal(base.rules["no-shadow"], "warn");
        assert.equal(base.rules["@typescript-eslint/no-shadow"], undefined);
        assert.equal(base.rules["no-console"], undefined);
        assert.equal(base.rules["no-debugger"], "warn");
        assert.deepEqual(base.options, {
            typeAware: true,
            typeCheck: true,
            denyWarnings: true,
            reportUnusedDisableDirectives: "error",
        });
        assert.deepEqual(base.env, { builtin: true });
        assert.ok(base.ignorePatterns.includes("**/node_modules/**"));
        assert.ok(base.ignorePatterns.includes("**/dist/**"));
        assert.equal(base.rules["typescript/no-deprecated"], "error");
        assert.deepEqual(base.plugins, [
            "unicorn",
            "typescript",
            "oxc",
            "import",
            "vitest",
            "promise",
        ]);
        assert.equal(
            base.rules["import/no-relative-parent-imports"],
            undefined
        );
    });
});

describe("@concertypin/config/oxlint overrides", () => {
    it("exports the shared declaration exception", () => {
        assert.deepEqual(base.overrides, [
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
        ]);
        assert.equal(frontend.overrides, undefined);
    });
});

describe("@concertypin/config/oxlint/frontend", () => {
    it("exports only frontend additions without duplicating the base", () => {
        assert.equal(Object.keys(frontend.rules).length, 5);
        assert.deepEqual(
            Object.keys(frontend.rules).filter((rule) => rule in base.rules),
            []
        );
        assert.equal(frontend.rules["no-var"], undefined);
        assert.equal(frontend.rules["no-console"], "warn");
        assert.equal(frontend.rules["no-debugger"], undefined);
        assert.equal(frontend.rules["typescript/no-deprecated"], undefined);
        assert.equal(frontend.rules["tailwindcss/no-unknown-classes"], "error");
        assert.equal(frontend.plugins, undefined);
        assert.equal(frontend.options, undefined);
        assert.deepEqual(frontend.jsPlugins, ["oxlint-tailwindcss"]);
        assert.deepEqual(frontend.settings.tailwindcss, {
            entryPoint: "src/index.css",
        });
        assert.deepEqual(legacyFrontend.settings.tailwindcss, {
            entryPoint: "legacy.css",
        });
    });

    it("omits Tailwind plugin, rules, and settings values when no entry point is given", () => {
        assert.deepEqual(frontendWithoutTailwind.rules, {
            "no-console": "warn",
        });
        assert.equal(frontendWithoutTailwind.jsPlugins, undefined);
        // Always present so `settings: frontend.settings` type-checks at the root.
        assert.deepEqual(frontendWithoutTailwind.settings, {});
        assert.equal(
            frontendWithoutTailwind.rules["tailwindcss/no-unknown-classes"],
            undefined
        );
    });

    it("marks the positional overload deprecated and exposes the options overload", () => {
        const declaration = readFileSync(
            new URL("../dist/oxlint/frontend.d.ts", import.meta.url),
            "utf8"
        );

        assert.match(
            declaration,
            /@deprecated[\s\S]*?createFrontendOxlintConfig\(entryPoint: string\)/u
        );
        assert.match(
            declaration,
            /createFrontendOxlintConfig\(options: OxlintFrontendConfig\)/u
        );
        assert.match(declaration, /tailwind\?: \{[\s\S]*?entryPoint: string;/u);
    });

    it("explains the expected call forms when called without options", () => {
        // Simulate an untyped JavaScript caller. Referencing a function with a
        // deprecated overload is reported even when no deprecated call is made.
        const untypedCreate = /** @type {(...args: unknown[]) => unknown} */ (
            // oxlint-disable-next-line typescript/no-deprecated
            createFrontendOxlintConfig
        );

        for (const args of [[], [null]]) {
            assert.throws(() => untypedCreate(...args), {
                name: "TypeError",
                message: /expects an options object/u,
            });
        }
    });

    it("rejects empty Tailwind paths instead of disabling linting", () => {
        for (const entryPoint of ["", " ", "\t\n"]) {
            assert.throws(
                () => createFrontendOxlintConfig({ tailwind: { entryPoint } }),
                { name: "TypeError", message: /nonempty CSS file path/u }
            );
        }
    });
});

describe("@concertypin/config/oxlint direct config usage", () => {
    it("lets Oxlint compose base and frontend presets through extends", () => {
        const resolved = JSON.parse(
            execSync(
                "pnpm exec oxlint --config tests/oxlint-frontend.config.ts --print-config src/oxlint/frontend.ts",
                { encoding: "utf8" }
            )
        );
        assert.equal(resolved.rules["no-console"], "warn");
        assert.equal(resolved.rules["no-debugger"], "warn");
        assert.equal(resolved.rules["no-var"], "deny");
        assert.equal(resolved.rules["typescript/no-deprecated"], "deny");
        assert.deepEqual(resolved.plugins, base.plugins);
    });

    it("inherits type-aware linting through extends", () => {
        assert.throws(
            () =>
                execSync(
                    "pnpm exec oxlint --config tests/oxlint-frontend.config.ts tests/invalid.deprecated.ts",
                    { encoding: "utf8", stdio: "pipe" }
                ),
            (error) => {
                assert.match(
                    `${error.stdout}${error.stderr}`,
                    /typescript\(no-deprecated\)/u
                );
                return true;
            }
        );
    });

    it("inherits type checking through extends", () => {
        assert.throws(
            () =>
                execSync(
                    "pnpm exec oxlint --config tests/oxlint-frontend.config.ts tests/invalid.typecheck.ts",
                    { encoding: "utf8", stdio: "pipe" }
                ),
            (error) => {
                assert.match(
                    `${error.stdout}${error.stderr}`,
                    /typescript\(TS2322\)/u
                );
                return true;
            }
        );
    });

    it("rejects a deprecated overload with type-aware linting", () => {
        assert.throws(
            () =>
                execSync(
                    "pnpm exec oxlint --config tests/oxlint-direct.config.ts tests/invalid.deprecated.ts",
                    { encoding: "utf8", stdio: "pipe" }
                ),
            (error) => {
                const output = `${error.stdout}${error.stderr}`;
                assert.equal(
                    (output.match(/typescript\(no-deprecated\)/gu) ?? [])
                        .length,
                    1,
                    output
                );
                assert.match(output, /invalid\.deprecated\.ts:4:1/u);
                return true;
            }
        );
    });

    it("allows nullish loose equality but fails on other loose comparisons", () => {
        // The base preset sets denyWarnings, so a single warning fails the run.
        assert.throws(
            () =>
                execSync(
                    "pnpm exec oxlint --config tests/oxlint-direct.config.ts tests/invalid.eqeqeq.ts",
                    { encoding: "utf8", stdio: "pipe" }
                ),
            (error) => {
                const output = `${error.stdout}${error.stderr}`;
                assert.equal(
                    (output.match(/eslint\(eqeqeq\)/gu) ?? []).length,
                    1,
                    output
                );
                assert.match(output, /invalid\.eqeqeq\.ts:4:/u);
                return true;
            }
        );
    });

    it("allows loosely typed mocks under tests", () => {
        const output = execSync(
            // Override globs resolve from the config file's directory, so use the root config.
            "pnpm exec oxlint --config oxlint.config.ts tests/loose-mock.ts",
            { encoding: "utf8", stdio: "pipe" }
        );

        assert.doesNotMatch(output, /no-unsafe-/u);
    });

    it("allows `any` and empty merged interfaces in declaration files", () => {
        const output = execSync(
            "pnpm exec oxlint --config tests/oxlint-direct.config.ts tests/declaration.d.ts",
            { encoding: "utf8", stdio: "pipe" }
        );

        assert.doesNotMatch(output, /no-explicit-any|no-empty-object-type/u);
    });

    it("keeps default plugins when the factory is the root config", () => {
        const resolved = JSON.parse(
            execSync(
                "pnpm exec oxlint --config tests/oxlint-direct.config.ts --print-config tests/valid.ts",
                { encoding: "utf8" }
            )
        );

        assert.deepEqual(resolved.plugins, [
            "unicorn",
            "typescript",
            "oxc",
            "import",
            "vitest",
            "promise",
        ]);
        assert.equal(resolved.rules["typescript/no-floating-promises"], "deny");
        assert.equal(resolved.rules["typescript/no-deprecated"], "deny");
        assert.equal(
            resolved.rules["oxc/bad-array-method-on-arguments"],
            "warn"
        );
        assert.equal(resolved.rules["unicorn/no-new-array"], "warn");
    });

    it("keeps default plugins when the factory is extended", () => {
        const resolved = JSON.parse(
            execSync(
                "pnpm exec oxlint --config oxlint.config.ts --print-config tests/valid.ts",
                { encoding: "utf8" }
            )
        );

        assert.deepEqual(resolved.plugins, [
            "unicorn",
            "typescript",
            "oxc",
            "import",
            "vitest",
            "promise",
        ]);
        // This repository's root config adds options to the rule, so compare severity only.
        assert.equal(
            resolved.rules["typescript/no-floating-promises"][0],
            "deny"
        );
        assert.equal(resolved.rules["typescript/no-deprecated"], "deny");
        assert.equal(
            resolved.rules["oxc/bad-array-method-on-arguments"],
            "warn"
        );
        assert.equal(resolved.rules["unicorn/no-new-array"], "warn");
    });
});

describe("@concertypin/config/oxfmt factories", () => {
    it("scopes import sorting to source and tests and exposes frontend Tailwind sorting", async () => {
        const { default: createOxfmtConfig } =
            await import("@concertypin/config/oxfmt");
        const { default: createFrontendOxfmtConfig } =
            await import("@concertypin/config/oxfmt/frontend");
        const baseFormat = createOxfmtConfig();
        const frontendFormat = createFrontendOxfmtConfig();

        assert.equal(baseFormat.sortImports, undefined);
        assert.deepEqual(baseFormat.overrides[2], {
            files: [
                "src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
                "tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
            ],
            options: { sortImports: { partitionByComment: true } },
        });
        assert.deepEqual(frontendFormat.sortTailwindcss.functions, [
            "clsx",
            "cn",
            "cva",
            "tw",
        ]);
    });
});
