import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals:     true,
    environment: "node",
    // DATABASE_URL points to the isolated test DB for all tests.
    // Unit tests mock db/client.ts so this value is never actually used by them.
    env: {
      LOG_LEVEL:    "silent",
      NODE_ENV:     "test",
      DATABASE_URL: "postgres://pms:pms@localhost:5432/pms_test",
    },
    globalSetup: ["tests/integration/global-setup.ts"],
    // Integration tests share a DB — run files sequentially to avoid race conditions
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include:  ["src/**/*.ts"],
      exclude:  ["src/db/migrations/**", "src/image-engine/**"],
    },
  },
});
