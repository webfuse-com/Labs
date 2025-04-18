import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default tseslint.config(
    eslint.configs.recommended,

    ...tseslint.configs.recommendedTypeChecked,
    {
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: [ "./tsconfig.lib.json" ],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_+$"
                }
            ],
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-this-alias": "off",
            "@typescript-eslint/no-unused-expressions": "off",
            "indent": [
                "error",
                "tab",
                {
                    "SwitchCase": 1,
                    "MemberExpression": "off"
                }
            ],
            "no-empty": [
                "error",
                {
                    "allowEmptyCatch": true
                }
            ],
            "no-async-promise-executor": "off",
            "no-control-regex": "off",
            "no-irregular-whitespace": "off",
            "no-mixed-spaces-and-tabs": "off",
            "prefer-arrow-callback": "error"
        }
    }
);