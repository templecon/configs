# @concertypin/config

Shared tool configuration presets for Templecon TypeScript templates.

## Usage

```bash
pnpm add -D "@concertypin/config@^0.4.0"
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

The factory returns a fresh copy of the shared rules. Add project-specific rules and overrides directly in the root config. The base preset allows `console` in `scripts/**/*.ts`, unused declarations in `**/*.d.ts`, and forbids parent-relative imports only in `src/**/*` and `tests/**/*`.

### Oxlint + Frontend (React / Solid / Svelte)

```ts
import createFrontend from "@concertypin/config/oxlint/frontend";
import { defineConfig } from "oxlint";

// pnpm add -D oxlint-tailwindcss
export default defineConfig({
    ...createFrontend("src/index.css"),
});
```

The frontend factory enables `oxlint-tailwindcss` and its conflict, duplicate,
deprecated, and unknown-class rules. Install that plugin and point `entryPoint`
to the project's CSS file that imports Tailwind (relative to the Oxlint config).
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

| Preset                                | Rules | Description                                              |
| ------------------------------------- | ----- | -------------------------------------------------------- |
| `@concertypin/config/oxlint`          | 104   | Shared template intersection and file-pattern exceptions |
| `@concertypin/config/oxlint/frontend` | 110   | Base + frontend rules + Tailwind lint rules              |
| `@concertypin/config/oxfmt`           | —     | Shared Oxfmt formatting contract                         |
| `@concertypin/config/oxfmt/frontend`  | —     | Base + Tailwind class sorting                            |

## License

MIT
