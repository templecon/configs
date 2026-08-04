import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryRoot = mkdtempSync(
    join(tmpdir(), "templecon-config-pack-check-")
);
const packDirectory = join(temporaryRoot, "pack");
const projectDirectory = join(temporaryRoot, "project");
const pnpmScript = process.env.npm_execpath;
assert.ok(pnpmScript, "pnpm did not expose npm_execpath");

function runPnpm(arguments_, cwd) {
    return execFileSync(process.execPath, [pnpmScript, ...arguments_], {
        cwd,
        encoding: "utf8",
        stdio: "pipe",
    });
}

function spawnPnpm(arguments_, cwd) {
    return spawnSync(process.execPath, [pnpmScript, ...arguments_], {
        cwd,
        encoding: "utf8",
    });
}

function assertCommandSucceeded(result) {
    assert.equal(result.status, 0, result.stderr || result.stdout);
}

try {
    mkdirSync(packDirectory);
    mkdirSync(projectDirectory);

    runPnpm(["pack", "--pack-destination", packDirectory], repositoryRoot);
    const tarballName = readdirSync(packDirectory).find((name) =>
        name.endsWith(".tgz")
    );
    assert.ok(tarballName, "pnpm pack did not create a tarball");

    const tarballPath = join(packDirectory, tarballName);
    const packageJson = JSON.parse(
        readFileSync(join(repositoryRoot, "package.json"), "utf8")
    );
    writeFileSync(
        join(projectDirectory, "package.json"),
        JSON.stringify({
            name: "templecon-config-pack-check",
            private: true,
            type: "module",
        })
    );

    runPnpm(
        [
            "add",
            "--ignore-scripts",
            tarballPath,
            `oxfmt@${packageJson.devDependencies.oxfmt}`,
            `oxlint@${packageJson.devDependencies.oxlint}`,
        ],
        projectDirectory
    );

    const importResult = spawnSync(
        process.execPath,
        [
            "--input-type=module",
            "--eval",
            [
                'import base from "@concertypin/config/oxlint";',
                'import frontend from "@concertypin/config/oxlint/frontend";',
                'import format from "@concertypin/config/oxfmt";',
                'if (base.rules["no-var"] !== "error") process.exit(1);',
                'if (frontend.rules["no-console"] !== "warn") process.exit(1);',
                'if (base.overrides[1].rules["no-console"] !== "off") process.exit(1);',
                "if (format.printWidth !== 80) process.exit(1);",
                "if (format.sortPackageJson !== false) process.exit(1);",
                "if (format.overrides[0].options.tabWidth !== 2) process.exit(1);",
                'if (format.overrides[1].options.trailingComma !== "none") process.exit(1);',
            ].join("\n"),
        ],
        { cwd: projectDirectory, encoding: "utf8" }
    );
    assertCommandSucceeded(importResult);

    writeFileSync(
        join(projectDirectory, "oxlint.config.mjs"),
        [
            'import base from "@concertypin/config/oxlint";',
            "export default {",
            "  extends: [base],",
            '  rules: { "no-console": "error", "no-unused-vars": "error" },',
            "};",
        ].join("\n")
    );
    writeFileSync(
        join(projectDirectory, "valid.ts"),
        readFileSync(join(repositoryRoot, "tests", "valid.ts"), "utf8")
    );
    writeFileSync(
        join(projectDirectory, "invalid.ts"),
        readFileSync(join(repositoryRoot, "tests", "invalid.ts"), "utf8")
    );

    assertCommandSucceeded(
        spawnPnpm(
            ["exec", "oxlint", "-c", "oxlint.config.mjs", "valid.ts"],
            projectDirectory
        )
    );

    writeFileSync(
        join(projectDirectory, "valid.d.ts"),
        "declare const unusedDeclaration: string;\n"
    );
    mkdirSync(join(projectDirectory, "scripts"));
    writeFileSync(
        join(projectDirectory, "scripts", "console.ts"),
        'console.log("allowed in scripts");\n'
    );

    for (const filename of ["valid.d.ts", "scripts/console.ts"]) {
        assertCommandSucceeded(
            spawnPnpm(
                ["exec", "oxlint", "-c", "oxlint.config.mjs", filename],
                projectDirectory
            )
        );
    }

    const invalidResult = spawnPnpm(
        ["exec", "oxlint", "-c", "oxlint.config.mjs", "invalid.ts"],
        projectDirectory
    );
    const invalidOutput = `${invalidResult.stdout}${invalidResult.stderr}`;
    assert.notEqual(invalidResult.status, 0, invalidOutput);
    assert.match(invalidOutput, /no-var/u);

    writeFileSync(
        join(projectDirectory, "oxfmt.config.ts"),
        [
            'import base from "@concertypin/config/oxfmt";',
            'import { defineConfig } from "oxfmt";',
            "export default defineConfig({ ...base });",
        ].join("\n")
    );
    writeFileSync(
        join(projectDirectory, "nested.ts"),
        "const value = {\nnested: {\nenabled: true\n}\n}\n"
    );
    writeFileSync(
        join(projectDirectory, "nested.yml"),
        "jobs:\n    build:\n        runs-on: ubuntu-latest\n"
    );
    const packageDirectory = join(projectDirectory, "package-fixture");
    mkdirSync(packageDirectory);
    writeFileSync(
        join(packageDirectory, "package.json"),
        '{"zebra":true,"name":"fixture","dependencies":{"z":"1.0.0","a":"1.0.0"}}\n'
    );
    writeFileSync(
        join(projectDirectory, "fixture.jsonc"),
        '{\n  "bindings": [\n    "KV",\n  ],\n}\n'
    );

    assertCommandSucceeded(
        spawnPnpm(
            [
                "exec",
                "oxfmt",
                "nested.ts",
                "nested.yml",
                "package-fixture/package.json",
                "fixture.jsonc",
            ],
            projectDirectory
        )
    );

    assert.match(
        readFileSync(join(projectDirectory, "nested.ts"), "utf8"),
        /^const value = \{\n {4}nested: \{\n {8}enabled: true,\n {4}\},\n\};\n$/u
    );
    assert.equal(
        readFileSync(join(projectDirectory, "nested.yml"), "utf8"),
        "jobs:\n  build:\n    runs-on: ubuntu-latest\n"
    );
    const formattedPackage = readFileSync(
        join(packageDirectory, "package.json"),
        "utf8"
    );
    assert.ok(
        formattedPackage.indexOf('"zebra"') <
            formattedPackage.indexOf('"name"') &&
            formattedPackage.indexOf('"name"') <
                formattedPackage.indexOf('"dependencies"'),
        "Oxfmt unexpectedly reordered package keys"
    );
    assert.doesNotMatch(
        readFileSync(join(projectDirectory, "fixture.jsonc"), "utf8"),
        /,\n[ \t]*[\]}]/u
    );
    assertCommandSucceeded(
        spawnPnpm(
            [
                "exec",
                "oxfmt",
                "--check",
                "nested.ts",
                "nested.yml",
                "package-fixture/package.json",
                "fixture.jsonc",
            ],
            projectDirectory
        )
    );

    console.log("Packed exports and Oxlint/Oxfmt behavior verified.");
} finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
}
