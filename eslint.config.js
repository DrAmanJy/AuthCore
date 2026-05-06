import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules", "dist", "build", "coverage", ".pnpm-store", ".turbo"],
  },

  js.configs.recommended,

  prettier,

  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": "warn",
      "no-async-promise-executor": "error",

      eqeqeq: ["error", "always"],
      // curly: ["error", "all"],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "no-trailing-spaces": "warn",
      // "eol-last": ["warn", "always"],

      "no-console": [
        "warn",
        {
          allow: ["warn", "error", "info"],
        },
      ],
    },
  },
];
