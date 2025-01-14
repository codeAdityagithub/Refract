import { build } from "esbuild";
import path from "path";

build({
    entryPoints: ["./components/Main.tsx"], // Your JSX entry file
    bundle: true, // Bundle all dependencies into one file
    outfile: "dist/bundle.js", // Output file
    minify: false, // Minify the output
    format: "esm", // Output as ES module
    jsx: "transform", // Convert JSX to JavaScript
    jsxFactory: "createElement", // Use your custom createElement function,
    inject: [path.join(import.meta.dirname, "./signals.ts")],
})
    .then(() => {
        console.log("Build succeeded.");
    })
    .catch(() => {
        console.error("Build failed.");
    });
