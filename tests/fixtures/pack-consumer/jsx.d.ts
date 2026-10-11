// A minimal JSX type environment so type-aware linting stays enabled for .tsx.
declare namespace JSX {
    interface Element {
        readonly kind?: "fixture";
    }
    interface IntrinsicElements {
        div: { className?: string };
    }
}
