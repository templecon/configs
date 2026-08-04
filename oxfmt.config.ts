import base from "./src/oxfmt/index.ts";
import { defineConfig } from "oxfmt";

export default defineConfig({
    ...base,
    ignorePatterns: ["pnpm-lock.yaml", "LICENSE"],
});
