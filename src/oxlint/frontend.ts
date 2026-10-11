// @concertypin/config/oxlint/frontend — Frontend additions with optional Tailwind rules

import type { OxlintConfig } from "oxlint";

/** Frontend additions that report console usage. */
const frontendRules: OxlintConfig["rules"] = {
    "no-console": "warn",
};

/** Tailwind class checks enabled when a CSS entry point is configured. */
const tailwindRules: OxlintConfig["rules"] = {
    "tailwindcss/no-conflicting-classes": "error",
    "tailwindcss/no-deprecated-classes": "error",
    "tailwindcss/no-duplicate-classes": "warn",
    "tailwindcss/no-unknown-classes": "error",
};

/**
 * Frontend preset result. `settings` is always present (empty without Tailwind)
 * so consumers can pass `settings: frontend.settings` at the root even with
 * `exactOptionalPropertyTypes`; Oxlint does not inherit settings through `extends`.
 */
export type OxlintFrontendPreset = OxlintConfig & {
    settings: NonNullable<OxlintConfig["settings"]>;
};

/** Options for the frontend preset and its optional Tailwind integration. */
export type OxlintFrontendConfig = {
    /**
     * Enable Tailwind CSS lint rules and configure the CSS entry point.
     * If omitted, Tailwind CSS linting is disabled.
     */
    tailwind?: {
        /**
         * Path to the CSS file that imports Tailwind.
         * Must not be empty or contain only whitespace.
         * @example "src/index.css"
         */
        entryPoint: string;
    };
};

/**
 * Creates the frontend configuration with Tailwind linting enabled.
 * @param entryPoint Path to the CSS file that imports Tailwind.
 * @returns A fresh frontend configuration with Tailwind rules and settings.
 * @deprecated Use `createFrontendOxlintConfig({ tailwind: { entryPoint } })` instead.
 */
export function createFrontendOxlintConfig(
    entryPoint: string
): OxlintFrontendPreset;

/**
 * Creates the shared frontend Oxlint config.
 * Pass `tailwind.entryPoint` to enable Tailwind CSS lint rules.
 * @param options Frontend options; pass `{}` to omit Tailwind linting.
 * @returns Frontend additions to combine with the base preset through Oxlint's `extends`.
 */
export function createFrontendOxlintConfig(
    options: OxlintFrontendConfig
): OxlintFrontendPreset;

/** Normalizes both call forms and composes the frontend preset. */
export function createFrontendOxlintConfig(
    entryPointOrOptions: string | OxlintFrontendConfig
): OxlintFrontendPreset {
    // Untyped callers may omit the argument; explain the expected call forms.
    if (
        typeof entryPointOrOptions !== "string" &&
        (typeof entryPointOrOptions !== "object" ||
            entryPointOrOptions === null)
    ) {
        throw new TypeError(
            "createFrontendOxlintConfig expects an options object. " +
                'Pass {} to omit Tailwind, or { tailwind: { entryPoint: "src/index.css" } } to enable it.'
        );
    }

    /** Tailwind options from either supported call form; absent when disabled. */
    const tailwind =
        typeof entryPointOrOptions === "string"
            ? { entryPoint: entryPointOrOptions }
            : entryPointOrOptions.tailwind;

    if (
        tailwind &&
        (typeof tailwind.entryPoint !== "string" ||
            tailwind.entryPoint.trim().length === 0)
    ) {
        throw new TypeError(
            "Tailwind entryPoint must be a nonempty CSS file path."
        );
    }

    /** Final configuration; a supplied Tailwind option must have a valid path. */
    const config: OxlintFrontendPreset = {
        ...(tailwind ? { jsPlugins: ["oxlint-tailwindcss"] } : {}),
        settings: tailwind
            ? { tailwindcss: { entryPoint: tailwind.entryPoint } }
            : {},
        rules: {
            ...frontendRules,
            ...(tailwind ? tailwindRules : {}),
        },
    };

    return config;
}

// Export the overload set, including the deprecated compatibility signature.
// oxlint-disable-next-line typescript/no-deprecated
export default createFrontendOxlintConfig;
