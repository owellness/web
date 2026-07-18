import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

// 3-tier layered architecture boundaries.
// Dependencies flow Presentation -> Application -> Infrastructure (via ports).
// `from` is written as a glob ("**") so eslint-plugin-import uses its glob
// validator and the `except` entries below are matched as globs too.
const layerRules = {
  plugins: { import: importPlugin },
  rules: {
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          // Tier 1 (Presentation/App) -> Infrastructure: blocked,
          // except the two Next.js + Auth.js integration entry points.
          {
            target: ["./src/presentation/**", "./src/app/**"],
            from: "./src/infrastructure/**",
            except: [
              "**/infrastructure/auth/authConfig.ts",
              "**/infrastructure/di/container.ts",
            ],
            message:
              "Presentation/App must call Application services, not Infrastructure.",
          },
          // Tier 2 (Application) -> Infrastructure: blocked entirely.
          {
            target: "./src/application/**",
            from: "./src/infrastructure/**",
            message:
              "Application must depend on ports, never on Infrastructure.",
          },
          // Tier 2 -> Presentation/App: blocked.
          {
            target: "./src/application/**",
            from: ["./src/presentation/**", "./src/app/**"],
            message: "Application cannot depend on Presentation.",
          },
          // Tier 3 (Infrastructure) -> Presentation/App: blocked.
          {
            target: "./src/infrastructure/**",
            from: ["./src/presentation/**", "./src/app/**"],
            message: "Infrastructure cannot depend on Presentation.",
          },
          // Tier 3 -> Application: only ports/model/policy/shared allowed.
          {
            target: "./src/infrastructure/**",
            from: "./src/application/**",
            except: [
              "**/application/**/ports.ts",
              "**/application/**/model.ts",
              "**/application/**/policy.ts",
              "**/application/shared/**",
            ],
            message:
              "Infrastructure may only import Application ports/models/policy/shared.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  layerRules,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/infrastructure/db/migrations/**",
  ]),
]);

export default eslintConfig;
