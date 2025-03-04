import { defineConfig } from "vite";
// @ts-expect-error
import path from "path";
// @ts-expect-error
const isProd = process.env.NODE_ENV === "production";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    root: "./",
    build: {
        outDir: isProd ? "build" : "dist",
        minify: true,
        sourcemap: !isProd,
        rollupOptions: {
            input: "./index.html",
        },
    },
    esbuild: {
        jsxFactory: "createElement", // Your custom JSX factory function
        jsxFragment: '"FRAGMENT"', // Your custom fragment syntax,
        jsxInject: `import { createElement } from "refract-js"`,
    },
    plugins: [tailwindcss()],
    server: {
        port: 3000,
    },
});
