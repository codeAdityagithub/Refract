import { defineConfig } from "vite";
// @ts-expect-error
import path from "path";

// @ts-expect-error
const isProd = process.env.NODE_ENV === "production";
import dts from "vite-plugin-dts";

export default defineConfig({
    root: "./",
    build: {
        outDir: isProd ? "build" : "dist",
        minify: true,
        sourcemap: !isProd,
        rollupOptions: {
            output: {
                preserveModules: false,
            },
        },
        lib: {
            entry: ["src/index.ts"],
            name: "Refract",
            fileName: "refract",
        },
    },
    resolve: {
        alias: {
            // @ts-expect-error
            "@": path.resolve(__dirname, "./"),
        },
    },
    server: {
        port: 3000,
    },
    plugins: [
        dts({
            entryRoot: "src",
            exclude: ["**/*.test.ts", "src/tests/**/*", "examples/**/*"],
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],
});
