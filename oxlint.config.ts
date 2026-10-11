// Root oxlint config for @concertypin/config itself.
// Extends the local shared base and ignores invalid and pack-check fixtures.
import { defineConfig } from "oxlint";

import createBase from "./src/oxlint/index.ts";

export default defineConfig({
    options: { typeAware: true },
    extends: [createBase()],
    ignorePatterns: ["tests/invalid.*", "tests/fixtures/**"],
});
