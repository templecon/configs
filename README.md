# @concertypin/config

Shared tool configuration presets for Templecon TypeScript templates.

## Usage

```bash
pnpm add -D '@concertypin/config@^0.1.0'
```

### Oxlint (base — all non-Svelte templates)

```ts
import base from "@concertypin/config/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
    extends: [base],
    // repo-specific overrides
});
```

### Oxlint + Frontend (React / Solid)

```ts
import frontend from "@concertypin/config/oxlint/frontend";
import { defineConfig } from "oxlint";

export default defineConfig({
    extends: [frontend],
    // repo-specific overrides
});
```

## What's included

| Preset                                | Rules | Description                                       |
| ------------------------------------- | ----- | ------------------------------------------------- |
| `@concertypin/config/oxlint`          | 116   | Intersection of 6 non-Svelte template aggregators |
| `@concertypin/config/oxlint/frontend` | 118   | Base + `typescript/no-deprecated` + `no-console`  |

See [TODO.md](./TODO.md) for planned extensions.

## License

Apache-2.0
