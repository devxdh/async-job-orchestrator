import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/server.ts"],
    format: ["esm"],
    target: "node20",
    platform: "node",
    outDir: "dist",
    sourcemap: true,
    clean: true,
    splitting: false,
    dts: false,
    tsconfig: "tsconfig.build.json",
});
