import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import {
    copyFileSync,
    cpSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository whose package is built and packed for this check. */
const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
/**
 * Files of the consumer project. Several are deliberately unformatted or
 * invalid, so the repository's own lint, format, and type checks skip them.
 * Config files use non-default names (`*.base.config.ts`) so Oxlint and Oxfmt
 * running in this repository do not pick them up as nested configs.
 */
const fixtureDirectory = join(
    repositoryRoot,
    "tests",
    "fixtures",
    "pack-consumer"
);
/** Isolated workspace for the tarball and consumer project; removed in `finally`. */
const temporaryRoot = mkdtempSync(
    join(tmpdir(), "templecon-config-pack-check-")
);
/** Destination for the package tarball produced by `pnpm pack`. */
const packDirectory = join(temporaryRoot, "pack");
/** Consumer project that installs and exercises the packed package. */
const projectDirectory = join(temporaryRoot, "project");
/** pnpm entry point supplied by the parent package script. */
const pnpmScript = process.env.npm_execpath;
assert.ok(pnpmScript, "pnpm did not expose npm_execpath");
/** Runs a standalone pnpm executable directly, or its JavaScript entry point via Node. */
const pnpmCommand = pnpmScript.toLowerCase().endsWith(".exe")
    ? { executable: pnpmScript, prefixArguments: [] }
    : { executable: process.execPath, prefixArguments: [pnpmScript] };

/**
 * Runs a pnpm setup command and throws if it fails.
 * @param arguments_ Arguments passed to pnpm.
 * @param cwd Working directory for the command.
 * @returns Captured standard output as UTF-8 text.
 */
function runPnpm(arguments_: string[], cwd: string) {
    return execFileSync(
        pnpmCommand.executable,
        [...pnpmCommand.prefixArguments, ...arguments_],
        {
            cwd,
            encoding: "utf8",
            stdio: "pipe",
        }
    );
}

/**
 * Runs pnpm and retains its exit status and output for assertions.
 * @param arguments_ Arguments passed to pnpm.
 * @param cwd Working directory for the command.
 * @returns The process result, including standard output and standard error.
 */
function spawnPnpm(arguments_: string[], cwd: string) {
    return spawnSync(
        pnpmCommand.executable,
        [...pnpmCommand.prefixArguments, ...arguments_],
        {
            cwd,
            encoding: "utf8",
        }
    );
}

/**
 * Requires a zero exit status and uses captured output as the failure message.
 * @param result Process result to check.
 */
function assertCommandSucceeded(result: SpawnSyncReturns<string>) {
    assert.equal(result.status, 0, result.stderr || result.stdout);
}

/**
 * Reads a file of the consumer project after a command has run.
 * @param path Path relative to the consumer project.
 */
function readProjectFile(path: string) {
    return readFileSync(join(projectDirectory, path), "utf8");
}

try {
    mkdirSync(packDirectory);
    cpSync(fixtureDirectory, projectDirectory, { recursive: true });
    // Reuse the repository's lint fixtures so both checks share one source.
    for (const filename of ["valid.ts", "invalid.ts"]) {
        copyFileSync(
            join(repositoryRoot, "tests", filename),
            join(projectDirectory, filename)
        );
    }

    runPnpm(["pack", "--pack-destination", packDirectory], repositoryRoot);
    const tarballName = readdirSync(packDirectory).find((name) =>
        name.endsWith(".tgz")
    );
    assert.ok(tarballName, "pnpm pack did not create a tarball");

    const tarballPath = join(packDirectory, tarballName);
    const packageJson = JSON.parse(
        readFileSync(join(repositoryRoot, "package.json"), "utf8")
    );
    /** Exercise the oldest Oxlint version allowed by the published peer range. */
    const minimumOxlintVersion = packageJson.peerDependencies.oxlint.match(
        /^>=(\d+\.\d+\.\d+) <2$/u
    )?.[1];
    assert.ok(minimumOxlintVersion, "Expected an explicit Oxlint peer minimum");

    runPnpm(
        [
            "add",
            "--ignore-scripts",
            tarballPath,
            `oxfmt@${packageJson.devDependencies.oxfmt}`,
            `oxlint@${minimumOxlintVersion}`,
            `oxlint-tsgolint@${packageJson.devDependencies["oxlint-tsgolint"]}`,
            `oxlint-tailwindcss@${packageJson.devDependencies["oxlint-tailwindcss"]}`,
            `tailwindcss@${packageJson.devDependencies.tailwindcss}`,
        ],
        projectDirectory
    );

    // Every published entry point resolves by package name.
    assertCommandSucceeded(
        spawnSync(process.execPath, ["check-exports.mjs"], {
            cwd: projectDirectory,
            encoding: "utf8",
        })
    );

    for (const filename of ["valid.ts", "valid.d.ts", "scripts/console.ts"]) {
        assertCommandSucceeded(
            spawnPnpm(
                ["exec", "oxlint", "-c", "oxlint.base.config.ts", filename],
                projectDirectory
            )
        );
    }

    const invalidResult = spawnPnpm(
        ["exec", "oxlint", "-c", "oxlint.base.config.ts", "invalid.ts"],
        projectDirectory
    );
    const invalidOutput = `${invalidResult.stdout}${invalidResult.stderr}`;
    assert.notEqual(invalidResult.status, 0, invalidOutput);
    assert.match(invalidOutput, /no-var/u);

    // Exercise the documented consumer composition with the actual Tailwind plugin.
    assertCommandSucceeded(
        spawnPnpm(
            [
                "exec",
                "oxlint",
                "-c",
                "oxlint.tailwind.config.ts",
                "tailwind-valid.tsx",
            ],
            projectDirectory
        )
    );
    const tailwindResult = spawnPnpm(
        [
            "exec",
            "oxlint",
            "-c",
            "oxlint.tailwind.config.ts",
            "tailwind-invalid.tsx",
        ],
        projectDirectory
    );
    const tailwindOutput = `${tailwindResult.stdout}${tailwindResult.stderr}`;
    assert.equal(tailwindResult.status, 1, tailwindOutput);
    for (const rule of [
        "no-conflicting-classes",
        "no-duplicate-classes",
        "no-unknown-classes",
    ]) {
        assert.ok(tailwindOutput.includes(rule), tailwindOutput);
    }

    assertCommandSucceeded(
        spawnPnpm(
            [
                "exec",
                "oxfmt",
                "--config",
                "oxfmt.base.config.ts",
                "nested.ts",
                "src/imports.ts",
                "root-imports.ts",
                "nested.yml",
                "package-fixture/package.json",
                "fixture.jsonc",
            ],
            projectDirectory
        )
    );

    assertCommandSucceeded(
        spawnPnpm(
            [
                "exec",
                "oxfmt",
                "--config",
                "oxfmt.frontend.config.ts",
                "frontend.jsx",
                "frontend-call.js",
            ],
            projectDirectory
        )
    );
    assert.match(
        readProjectFile("frontend.jsx"),
        /className="flex p-2 text-white"/u
    );
    assert.match(
        readProjectFile("frontend-call.js"),
        /cn\("flex p-2 text-white"\)/u
    );

    assert.match(
        readProjectFile("nested.ts"),
        /^const value = \{\n {4}nested: \{\n {8}enabled: true,\n {4}\},\n\};\n$/u
    );
    const formattedImports = readProjectFile("src/imports.ts");
    assert.ok(
        formattedImports.indexOf('from "node:path"') <
            formattedImports.indexOf('from "react"') &&
            formattedImports.indexOf('from "react"') <
                formattedImports.indexOf('from "../helper.js"') &&
            formattedImports.indexOf('from "../helper.js"') <
                formattedImports.indexOf('from "./local.js"'),
        "Oxfmt did not sort imports into the expected groups"
    );
    const rootImports = readProjectFile("root-imports.ts");
    assert.ok(
        rootImports.indexOf('from "./local.js"') <
            rootImports.indexOf('from "react"') &&
            rootImports.indexOf('from "react"') <
                rootImports.indexOf('from "node:path"'),
        "Oxfmt sorted imports outside src and tests"
    );
    assert.equal(
        readProjectFile("nested.yml"),
        "jobs:\n  build:\n    runs-on: ubuntu-latest\n"
    );
    const formattedPackage = readProjectFile("package-fixture/package.json");
    assert.ok(
        formattedPackage.indexOf('"zebra"') <
            formattedPackage.indexOf('"name"') &&
            formattedPackage.indexOf('"name"') <
                formattedPackage.indexOf('"dependencies"'),
        "Oxfmt unexpectedly reordered package keys"
    );
    assert.doesNotMatch(readProjectFile("fixture.jsonc"), /,\n[ \t]*[\]}]/u);
    assertCommandSucceeded(
        spawnPnpm(
            [
                "exec",
                "oxfmt",
                "--config",
                "oxfmt.base.config.ts",
                "--check",
                "nested.ts",
                "src/imports.ts",
                "nested.yml",
                "package-fixture/package.json",
                "fixture.jsonc",
            ],
            projectDirectory
        )
    );

    console.log(
        `Packed exports, Oxlint ${minimumOxlintVersion}, and Tailwind/Oxfmt behavior verified.`
    );
} finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
}
