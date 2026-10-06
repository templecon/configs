// @concertypin/config/oxlint/frontend — Base plus frontend and Tailwind rules

import type { OxlintConfig } from "oxlint";

import createOxlintConfig from "./index.js";

const frontendRules: NonNullable<OxlintConfig["rules"]> = {
    "typescript/no-deprecated": "error",
    "no-console": "warn",
    "tailwindcss/no-conflicting-classes": "error",
    "tailwindcss/no-deprecated-classes": "error",
    "tailwindcss/no-duplicate-classes": "warn",
    "tailwindcss/no-unknown-classes": "error",
};

export default function createFrontendOxlintConfig(
    entryPoint: string
): OxlintConfig {
    const base = createOxlintConfig();

    return {
        ...base,
        jsPlugins: ["oxlint-tailwindcss"],
        rules: {
            ...base.rules,
            ...frontendRules,
        },
        settings: {
            tailwindcss: { entryPoint },
        },
    };
}
