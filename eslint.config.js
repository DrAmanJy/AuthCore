import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.pnpm-store/**",
      "**/.turbo/**",
    ],
  },

  // JavaScript
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],

    ...js.configs.recommended,

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
      "no-constant-condition": "error",
      "no-async-promise-executor": "error",

      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "error",

      "no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_$",
          vars: "all",
          varsIgnorePattern: "^_$",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_$",
        },
      ],

      "no-trailing-spaces": "error",

      "no-console": [
        "error",
        {
          allow: ["warn", "error", "info"],
        },
      ],

      "no-throw-literal": "error",
    },
  },

  // TypeScript
  {
    files: ["**/*.ts", "**/*.tsx"],

    ...tseslint.configs.recommendedTypeChecked,

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_$",
          vars: "all",
          varsIgnorePattern: "^_$",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_$",
          ignoreRestSiblings: false,
        },
      ],

      "@typescript-eslint/no-explicit-any": "error",

      "@typescript-eslint/no-non-null-assertion": "error",

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      "@typescript-eslint/consistent-type-exports": "error",

      "@typescript-eslint/no-inferrable-types": "error",

      "@typescript-eslint/no-unnecessary-condition": "error",

      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: true,
          checksConditionals: true,
          checksSpreads: true,
        },
      ],

      "@typescript-eslint/require-await": "error",

      "@typescript-eslint/return-await": ["error", "in-try-catch"],

      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreVoid: false,
        },
      ],

      "@typescript-eslint/await-thenable": "error",

      "@typescript-eslint/prefer-nullish-coalescing": "error",

      "@typescript-eslint/prefer-optional-chain": "error",

      "@typescript-eslint/no-confusing-void-expression": "error",

      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "no-undef": "error",

      "no-unreachable": "error",

      "no-constant-condition": "error",

      "no-async-promise-executor": "error",

      eqeqeq: ["error", "always"],

      "no-var": "error",

      "prefer-const": "error",

      "prefer-template": "error",

      "no-trailing-spaces": "error",

      "no-console": [
        "error",
        {
          allow: ["warn", "error", "info"],
        },
      ],

      "no-throw-literal": "error",

      "no-return-await": "error",
    },
  },

  prettier,
];
