import { defineConfig } from "tsup";

export default defineConfig({
  // bundle entry point
  entry: ["src/main.ts"],
  // output as ES modules
  format: ["esm"],
  // target Node, not browser
  platform: "node",
  // transpile for Node 26
  target: "node26",
  // output folder
  outDir: "dist",
  // wipe dist before each build
  clean: true,
  // emit .map files for debugging
  sourcemap: true,
  // minify the output
  minify: true,
  // inline all app code into one file
  bundle: true,
  // don't split into chunks
  splitting: false,
});
