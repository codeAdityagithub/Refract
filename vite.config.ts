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
            "@": path.resolve(__dirname, "./src"),
        },
    },
    esbuild: {
        jsxFactory: "createElement", // Your custom JSX factory function
        jsxFragment: '"FRAGMENT"', // Your custom fragment syntax,
        jsxInject: `import { createElement } from "@/rendering/createElements.ts"`,
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
        {
            name: "generate-package-json",
            async closeBundle() {
                const fs = await import("fs");

                const packageJson = {
                    name: "refract",
                    version: "1.0.0",
                    main: "refract.js",
                    types: "index.d.ts",
                };

                fs.writeFileSync(
                    // @ts-expect-error
                    path.resolve(__dirname, "build/package.json"),
                    JSON.stringify(packageJson, null, 2)
                );
            },
        },
    ],
});
