import createBase from "@concertypin/config/oxlint";
import createFrontend from "@concertypin/config/oxlint/frontend";
import { defineConfig } from "oxlint";

/**
 * Consumer configuration whose presets are composed by Oxlint.
 * It omits root `options` to verify that `typeAware` is inherited.
 */
export default defineConfig({
    extends: [createBase(), createFrontend({})],
});
