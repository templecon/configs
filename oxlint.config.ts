// Root oxlint config for @concertypin/config itself.
// Extends the local shared base and ignores invalid test fixtures.
import { defineConfig } from "oxlint";
import base from "./oxlint/index.js";

export default defineConfig({
    extends: [base],
    ignorePatterns: ["tests/invalid.*"],
});
