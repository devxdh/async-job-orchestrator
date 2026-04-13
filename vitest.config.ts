import { defineConfig } from "vitest/config";
import path from "node:path";

const testDbWorkers = Number(process.env.DB_TEST_WORKERS ?? "4");

export default defineConfig({
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
      "@tests": path.resolve(__dirname, "tests"),
      "@modules": path.resolve(__dirname, "src/modules"),
    },
  },
  test: {
    globalSetup: path.resolve(__dirname, "tests/setup/globals.ts"),
    environment: "node",
    globals: true,
    pool: "forks",
    maxWorkers: testDbWorkers,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "testSecret",
      VITEST: "true",
      DB_TEST_NAME: "jobapp_test",
      DB_TEST_WORKERS: String(testDbWorkers)
    },
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    fileParallelism: true,
  },
});
