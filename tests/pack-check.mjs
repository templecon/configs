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
                'if (base.rules["no-var"] !== "error") process.exit(1);',
                'if (frontend.rules["no-console"] !== "warn") process.exit(1);',
            ].join("\n"),
        ],
        { cwd: projectDirectory, encoding: "utf8" }
    );
    assert.equal(
        importResult.status,
        0,
        importResult.stderr || importResult.stdout
    );

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

    const validResult = spawnPnpm(
        ["exec", "oxlint", "-c", "oxlint.config.mjs", "valid.ts"],
        projectDirectory
    );
    assert.equal(
        validResult.status,
        0,
        validResult.stderr || validResult.stdout
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
        const overrideResult = spawnPnpm(
            ["exec", "oxlint", "-c", "oxlint.config.mjs", filename],
            projectDirectory
        );
        assert.equal(
            overrideResult.status,
            0,
            overrideResult.stderr || overrideResult.stdout
        );
    }

    const invalidResult = spawnPnpm(
        ["exec", "oxlint", "-c", "oxlint.config.mjs", "invalid.ts"],
        projectDirectory
    );
    const invalidOutput = `${invalidResult.stdout}${invalidResult.stderr}`;
    assert.notEqual(invalidResult.status, 0, invalidOutput);
    assert.match(invalidOutput, /no-var/u);

    console.log("Packed exports and Oxlint behavior verified.");
} finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
}
