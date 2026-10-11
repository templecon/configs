// Declaration patterns the base preset allows in `*.d.ts` files.

interface GeneratedEnv {
    KV: string;
}

// Merges into a generated base, as Wrangler's `Env` does.
export interface Env extends GeneratedEnv {}

// Describes an untyped external API.
export declare function legacy(input: any): any;
