import { defineConfig } from "oxfmt";

import base from "./src/oxfmt/index.ts";

export default defineConfig({
    ...base(),
    ignorePatterns: ["pnpm-lock.yaml", "LICENSE"],
});
