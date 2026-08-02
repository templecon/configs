import assert from "node:assert/strict";
import { describe, it } from "node:test";

import base from "@concertypin/config/oxlint";
import frontend from "@concertypin/config/oxlint/frontend";

describe("@concertypin/config/oxlint", () => {
    it("exports the exact six-template rule intersection", () => {
        assert.equal(Object.keys(base.rules).length, 116);
        assert.equal(base.rules["no-var"], "error");
        assert.equal(base.rules["eqeqeq"], "warn");
        assert.equal(base.rules["no-console"], undefined);
        assert.equal(base.rules["typescript/no-deprecated"], undefined);
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
        assert.equal(Object.keys(frontend.rules).length, 118);
        assert.equal(frontend.rules["no-var"], "error");
        assert.equal(frontend.rules["no-console"], "warn");
        assert.equal(frontend.rules["typescript/no-deprecated"], "error");
    });
});
