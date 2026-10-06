import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: {
        "oxfmt/index": "src/oxfmt/index.ts",
        "oxfmt/frontend": "src/oxfmt/frontend.ts",
        "oxlint/frontend": "src/oxlint/frontend.ts",
        "oxlint/index": "src/oxlint/index.ts",
    },
    format: "esm",
    outExtensions: () => ({
        dts: ".d.ts",
        js: ".js",
    }),
    outDir: "dist",
});
