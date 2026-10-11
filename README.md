# @concertypin/config

Shared tool configuration presets for Templecon TypeScript templates.

## Usage

Requires Node.js 26 or later and Oxlint 1.87.0 or later (before 2.0).

```bash
pnpm add -D "@concertypin/config@^0.5.0" oxlint-tsgolint@7.0.2003
```

### Oxlint (base)

```ts
import createBase from "@concertypin/config/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
    extends: [createBase()],
    rules: { "no-console": "warn" },
});
```

The factory returns a fresh copy of the shared rules. Add project-specific rules and overrides directly in the root config. Keep that config at the project root: Oxlint resolves override file patterns from the config file's directory. The base preset allows `console` in `scripts/**/*.ts`, unused declarations, `any`, and empty interfaces in `**/*.d.ts`, and forbids parent-relative imports only in `src/**/*` and `tests/**/*`.

The base preset allows console calls and warns on `debugger` statements. The
frontend preset adds a `no-console` warning, so a config extending both warns on
both. Nullish comparisons such as `value == null` are
allowed. Tests under `tests/**/*` may use loosely typed mocks: unsafe assignment,
argument, call, member access, return, and unary-minus checks are disabled there,
while production code retains those checks. Parent-relative imports remain
forbidden in source and tests; configure the `@` alias in TypeScript and Vite.

#### Type-aware linting

The base preset rejects APIs marked `@deprecated` through
`typescript/no-deprecated` and enables other type-aware rules. Install
`oxlint-tsgolint` at the exact version in this package's peer dependency.
There are two ways to turn type-aware linting on.

**Documented path.** Set `options.typeAware: true` in the root config, or pass
`--type-aware` on the CLI. Oxlint documents this option as equivalent to the
CLI flag.

```ts
export default defineConfig({
    options: { typeAware: true },
    extends: [createBase()],
});
```

**Observed path (not documented).** Rely on the preset. `createBase()` sets
`options.typeAware: true`, and with Oxlint 1.87.0 that option takes effect
through `extends` as well as when the factory is the root config. Oxlint's
documentation does not say that `options` is inherited through `extends`. This
package's tests check the behavior, but a later Oxlint release may change it.

The base preset also enables type checking (`options.typeCheck`), fails on
warnings (`options.denyWarnings`; turn it off in the root config or with an
inline disable if a project only wants advisories), reports unused disable
directives as errors, turns on the `vitest` and `promise` plugins, sets
`env.builtin`, and ignores `node_modules`, `dist`, `dist-ts`, `coverage`,
`.cache`, `.vscode`, and `.git`.

With Oxlint 1.87.0, `extends` carries `plugins`, `jsPlugins`, `rules`,
`overrides`, and `options` (observed, not documented), but not `env`,
`ignorePatterns`, or `settings`. Use `export default createBase()` to get every
field, or repeat those three in the root config when you use `extends`.

The preset explicitly keeps Oxlint's default `unicorn`, `typescript`, and `oxc` plugins enabled alongside `import`. It can be used directly as the root config (`export default createBase()`) or from `extends` without losing those plugins.

### Oxlint + Frontend (React / Solid / Svelte)

```ts
import createBase from "@concertypin/config/oxlint";
import createFrontend from "@concertypin/config/oxlint/frontend";
import { defineConfig } from "oxlint";

// pnpm add -D oxlint-tailwindcss
const frontend = createFrontend({ tailwind: { entryPoint: "src/index.css" } });

export default defineConfig({
    extends: [createBase(), frontend],
    settings: frontend.settings,
});
```

The frontend factory returns only frontend additions. Oxlint combines them with
the base preset through `extends`. Common rules, plugins, and overrides are
provided by the base preset. Pass `tailwind.entryPoint`
to enable `oxlint-tailwindcss` and its conflict, duplicate, deprecated, and
unknown-class rules. Install that plugin and point `entryPoint` to the project's
CSS file that imports Tailwind. oxlint-tailwindcss 1.14.0 resolves a relative
`entryPoint` from the directory of the nearest `.oxlintrc.json` above the linted
file, then from Oxlint's working directory. It does not look for
`oxlint.config.ts`, so with a TypeScript config the path is relative to the
working directory: run Oxlint from the project root, or pass an absolute path. If Tailwind is not
used, pass an empty object and the plugin and rules are omitted. `settings` is
always an object (empty without Tailwind), so `settings: frontend.settings`
type-checks even with `exactOptionalPropertyTypes`.

A supplied Tailwind entry point must be nonempty; blank paths throw a configuration
error. Svelte markup is outside Oxlint's Tailwind lint coverage: only script
blocks are available to the plugin.

The object argument is the preferred API. The positional string overload is
deprecated and kept only so existing calls still type-check.

Since 0.5.0 the frontend preset no longer includes the base preset, with either
call form. Add `createBase()` to `extends`; otherwise the base rules, plugins,
overrides, and type-aware option are dropped without any error.

With Oxlint 1.87.0, `extends` carries the
frontend rules and JS plugin but does not carry `settings.tailwindcss.entryPoint`.
Pass `frontend.settings` to the root config, as shown above.
Add project-specific lint rules
and overrides in the root `defineConfig` object using Oxlint's normal config
shape.

### Oxfmt

```ts
import createBase from "@concertypin/config/oxfmt";
import { defineConfig } from "oxfmt";

const base = createBase();

export default defineConfig({
    ...base,
    printWidth: 100,
    overrides: [
        ...(base.overrides ?? []),
        { files: ["*.yaml"], options: { tabWidth: 4 } },
    ],
});
```

### Oxfmt + Frontend (React / Solid / Svelte)

```ts
import createFrontend from "@concertypin/config/oxfmt/frontend";
import { defineConfig } from "oxfmt";

export default defineConfig(createFrontend());
```

The frontend factory keeps the base formatting contract and sorts Tailwind
classes in `class`/`className` attributes and the `clsx`, `cn`, `cva`, and `tw`
functions.

The shared formatter contract sorts imports in `src` and `tests` using Oxfmt's
standard groups (built-ins, external packages, internal modules, local modules,
then styles), while keeping comment-delimited import groups and side-effect
import order. It uses four spaces by default, two spaces for YAML, an 80-column
width, and preserves `package.json` key order. Factories provide presets only;
add project-specific formatter options and overrides in the consuming config.

## What's included

| Preset                                | Rules | Description                                        |
| ------------------------------------- | ----- | -------------------------------------------------- |
| `@concertypin/config/oxlint`          | 105   | Shared template rules and file-pattern exceptions  |
| `@concertypin/config/oxlint/frontend` | 1–5   | Frontend additions; Tailwind rules when configured |
| `@concertypin/config/oxfmt`           | —     | Shared Oxfmt formatting contract                   |
| `@concertypin/config/oxfmt/frontend`  | —     | Base + Tailwind class sorting                      |

## License

MIT
