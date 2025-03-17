import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// @ts-expect-error
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
    build: {
        outDir: isProd ? "build" : "dist",
        minify: "terser",
        sourcemap: true,
        lib: {
            entry: "src/index.ts",
            name: "Refract",
            fileName: (format) => `refract.${format}.js`,
            formats: ["es", "cjs"], // Supports multiple module formats
        },
        rollupOptions: {
            output: {
                preserveModules: false,
            },
        },
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                ecma: 2020,
                passes: 3, // Runs multiple passes for more optimization
                pure_funcs: ["console.log"],
            },
            output: {
                comments: false,
            },
        },
    },
    esbuild: {
        jsxFactory: "createElement", // Your custom JSX factory function
        jsxFragment: '"FRAGMENT"', // Your custom fragment syntax,
        jsxInject: `import { createElement } from "../index"`,
    },
    server: {
        port: 3000,
    },
    plugins: [
        dts({
            entryRoot: "src",
            outDir: isProd ? "build" : "dist",
            exclude: [
                "**/*.test.ts",
                "src/tests/**/*",
                "examples/**/*",
                "src/components/**/*",
            ],
        }),
    ],
});
