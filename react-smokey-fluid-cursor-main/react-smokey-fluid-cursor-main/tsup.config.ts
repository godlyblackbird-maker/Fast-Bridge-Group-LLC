import { defineConfig } from "tsup";
import { readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { glob } from "glob";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  splitting: true,
  target: "es2017",
  external: ["react", "react-dom"],
  minify: true,
  shims: true,
  banner: {
    js: '"use client";',
  },
  onSuccess: () => {
    const cssMaps = glob.sync("dist/**/*.css.map");
    cssMaps.forEach((file) => rmSync(join(process.cwd(), file)));

    const files = glob.sync("dist/**/*.{js,mjs,cjs}");

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (!content.startsWith('"use client"')) {
        const fixed = content
          .replace(/["']use client["'];\s*/g, "")
          .trimStart();
        writeFileSync(file, `"use client";${fixed}`);
      }
    }

    return new Promise((resolve) => resolve(undefined));
  },
});
