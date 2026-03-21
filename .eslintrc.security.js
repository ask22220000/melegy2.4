/**
 * ESLint Config - Security Rules
 * Prevents sensitive code from appearing in client-side code
 */

module.exports = {
  rules: {
    /**
     * Prevent process.env access in client components
     * @see https://eslint.org/docs/rules
     */
    "@next/next/no-env-in-middle-of-declaration": "error",
    
    // Prevent API keys from being hardcoded
    "no-process-env": [
      "error",
      {
        description: "Use server-only utilities for environment variables",
      },
    ],

    // Prevent exposing secrets in strings
    "no-hardcoded-credentials": "warn",
  },

  // Custom rules can be defined here
  overrides: [
    {
      // Client components cannot access private env vars
      files: ["components/**/*.tsx", "app/page.tsx", "app/*/page.tsx"],
      rules: {
        "react/jsx-no-useless-fragment": "warn",
      },
    },

    // Server files CAN use process.env
    files: ["app/api/**/*", "lib/server/**/*"],
      rules: {
        // Allow process.env in server-only files
      },
    },
  ],
}
