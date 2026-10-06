import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { describe, it } from "node:test";

import createOxlintConfig from "@concertypin/config/oxlint";
import createFrontendOxlintConfig from "@concertypin/config/oxlint/frontend";

const base = createOxlintConfig();
const frontend = createFrontendOxlintConfig("src/index.css");

describe("@concertypin/config/oxlint", () => {
    it("exports the exact six-template rule intersection", () => {
        assert.equal(Object.keys(base.rules).length, 104);
        assert.equal(base.rules["no-var"], "error");
        assert.equal(base.rules["eqeqeq"], "warn");
        assert.equal(base.rules["no-shadow"], "warn");
        assert.equal(base.rules["@typescript-eslint/no-shadow"], undefined);
        assert.equal(base.rules["no-console"], undefined);
        assert.equal(base.rules["typescript/no-deprecated"], undefined);
        assert.deepEqual(base.plugins, [
            "unicorn",
            "typescript",
            "oxc",
            "import",
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
                files: ["**/*.d.ts"],
                rules: {
                    "no-unused-vars": "off",
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
        assert.deepEqual(frontend.overrides, base.overrides);
    });
});

describe("@concertypin/config/oxlint/frontend", () => {
    it("extends the base rules with the React and Solid delta", () => {
        assert.equal(Object.keys(frontend.rules).length, 110);
        assert.equal(frontend.rules["no-var"], "error");
        assert.equal(frontend.rules["no-console"], "warn");
        assert.equal(frontend.rules["typescript/no-deprecated"], "error");
        assert.equal(frontend.rules["tailwindcss/no-unknown-classes"], "error");
        assert.deepEqual(frontend.plugins, [
            "unicorn",
            "typescript",
            "oxc",
            "import",
        ]);
        assert.deepEqual(frontend.jsPlugins, ["oxlint-tailwindcss"]);
        assert.deepEqual(frontend.settings.tailwindcss, {
            entryPoint: "src/index.css",
        });
    });
});

describe("@concertypin/config/oxlint direct config usage", () => {
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
        ]);
        assert.equal(resolved.rules["typescript/no-floating-promises"], "deny");
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
        ]);
        assert.equal(resolved.rules["typescript/no-floating-promises"], "deny");
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
