// The documented consumer composition, exercised with the real Tailwind plugin.
import createBase from "@concertypin/config/oxlint";
import createFrontend from "@concertypin/config/oxlint/frontend";
import { defineConfig } from "oxlint";

const frontend = createFrontend({ tailwind: { entryPoint: "tailwind.css" } });

export default defineConfig({
    options: { typeAware: true },
    extends: [createBase(), frontend],
    settings: frontend.settings,
});
