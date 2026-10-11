import createBase from "@concertypin/config/oxlint";
import createFrontend from "@concertypin/config/oxlint/frontend";

export default {
    options: { typeAware: true },
    extends: [createBase(), createFrontend({})],
    rules: { "no-console": "error", "no-unused-vars": "error" },
};
