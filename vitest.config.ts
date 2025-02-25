import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
    },
    esbuild: {
        jsxFactory: "createElement",
        jsxFragment: '"FRAGMENT"',
        // jsxImportSource: "./src/rendering/createElements.ts",
        jsxInject: `import { createElement } from "../../rendering/createElements.ts"`,
    },
});
