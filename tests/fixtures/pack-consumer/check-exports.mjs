// Imports every published entry point by package name and checks key values.
import assert from "node:assert/strict";

import createBase from "@concertypin/config/oxlint";
import createFrontend from "@concertypin/config/oxlint/frontend";
import createFormat from "@concertypin/config/oxfmt";
import createFrontendFormat from "@concertypin/config/oxfmt/frontend";

const base = createBase();
const frontend = createFrontend({ tailwind: { entryPoint: "src/index.css" } });
const frontendWithoutTailwind = createFrontend({});
const legacyFrontend = createFrontend("legacy.css");
const format = createFormat();
const frontendFormat = createFrontendFormat();

assert.equal(base.rules["no-var"], "error");
assert.equal(
    base.overrides[2].rules["import/no-relative-parent-imports"],
    "error"
);
assert.equal(base.overrides[3].rules["no-console"], "off");
assert.equal(frontend.rules["no-console"], "warn");
assert.equal(frontend.settings.tailwindcss.entryPoint, "src/index.css");
assert.equal(legacyFrontend.settings.tailwindcss.entryPoint, "legacy.css");
assert.equal(frontendWithoutTailwind.jsPlugins, undefined);
assert.equal(
    frontendWithoutTailwind.rules["tailwindcss/no-unknown-classes"],
    undefined
);
assert.equal(format.printWidth, 80);
assert.equal(format.sortImports, undefined);
assert.equal(format.sortPackageJson, false);
assert.ok(frontendFormat.sortTailwindcss.functions.includes("cn"));
assert.equal(format.overrides[0].options.tabWidth, 2);
assert.equal(format.overrides[1].options.trailingComma, "none");
assert.equal(format.overrides[2].options.sortImports.partitionByComment, true);
