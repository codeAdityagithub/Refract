import { defineConfig } from "vite";
// @ts-expect-error
import path from "path";
// @ts-expect-error
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
    root: "./",
    build: {
        outDir: isProd ? "build" : "dist",
        minify: isProd,
        sourcemap: !isProd,
        rollupOptions: {
            input: "index.html",
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
});
