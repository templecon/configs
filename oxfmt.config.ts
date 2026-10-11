import { defineConfig } from "oxfmt";

import base from "./src/oxfmt/index.ts";

export default defineConfig({
    ...base(),
    // Pack-check fixtures are deliberately unformatted Oxfmt inputs.
    ignorePatterns: ["pnpm-lock.yaml", "LICENSE", "tests/fixtures/**"],
});
