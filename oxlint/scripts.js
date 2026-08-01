// @concertypin/config/oxlint/scripts — Script-specific Oxlint exceptions

/** @import { OxlintConfig } from "oxlint" */

/** @type {OxlintConfig} */
const config = {
    overrides: [
        {
            files: ["scripts/**/*.ts"],
            rules: {
                "no-console": "off",
            },
        },
    ],
};

export default config;
