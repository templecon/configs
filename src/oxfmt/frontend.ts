// @concertypin/config/oxfmt/frontend — Base plus Tailwind class sorting

import type { OxfmtConfig } from "oxfmt";

import createOxfmtConfig from "./index.js";

/**
 * Adds Tailwind class sorting to the shared formatting configuration.
 * Sorts supported class attributes and calls to `clsx`, `cn`, `cva`, and `tw`.
 * @returns A fresh frontend Oxfmt configuration.
 */
export default function createFrontendOxfmtConfig(): OxfmtConfig {
    return {
        ...createOxfmtConfig(),
        sortTailwindcss: {
            functions: ["clsx", "cn", "cva", "tw"],
        },
    };
}
