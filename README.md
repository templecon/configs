# @concertypin/config

Shared tool configuration presets for Templecon TypeScript templates.

## Usage

```bash
pnpm add -D "@concertypin/config@^0.3.0"
```

### Oxlint (base)

```ts
import base from "@concertypin/config/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
    extends: [base],
    // repo-specific overrides
});
```

The base preset allows `console` in `scripts/**/*.ts` and unused declarations in `**/*.d.ts`.

### Oxlint + Frontend (React / Solid)

```ts
import frontend from "@concertypin/config/oxlint/frontend";
import { defineConfig } from "oxlint";

export default defineConfig({
    extends: [frontend],
    // repo-specific overrides
});
```

### Oxfmt

```ts
import base from "@concertypin/config/oxfmt";
import { defineConfig } from "oxfmt";

export default defineConfig({
    ...base,
    // repo-specific ignore patterns and overrides
});
```

The shared formatter contract uses four spaces by default, two spaces for YAML, an 80-column width, and preserves `package.json` key order.

## What's included

| Preset                                | Rules | Description                                                      |
| ------------------------------------- | ----- | ---------------------------------------------------------------- |
| `@concertypin/config/oxlint`          | 116   | Shared template intersection and file-pattern exceptions         |
| `@concertypin/config/oxlint/frontend` | 118   | Base + `typescript/no-deprecated` + `no-console` outside scripts |
| `@concertypin/config/oxfmt`           | —     | Shared Oxfmt formatting contract                                 |

See [TODO.md](./TODO.md) for planned extensions.

## License

MIT
