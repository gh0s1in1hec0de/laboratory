import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        languageOptions: { globals: globals.browser },
        rules: {
            "indent": ["error", 4], // 1. Enforce 4 spaces for indentation
            "quotes": ["error", "double"], // 2. Enforce double quotes
            "no-unused-vars": "warn", // 3. Warn on unused variables
            "semi": ["error", "always"], // 4. Require semicolons
            "object-curly-spacing": ["error", "always"], // 5. Require spaces inside curly braces
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];