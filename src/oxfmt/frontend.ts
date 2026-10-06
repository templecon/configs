// @concertypin/config/oxfmt/frontend — Base plus Tailwind class sorting

import type { OxfmtConfig } from "oxfmt";

import createOxfmtConfig from "./index.js";

export default function createFrontendOxfmtConfig(): OxfmtConfig {
    return {
        ...createOxfmtConfig(),
        sortTailwindcss: {
            functions: ["clsx", "cn", "cva", "tw"],
        },
    };
}
