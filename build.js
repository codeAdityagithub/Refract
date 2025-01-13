import { build } from "esbuild";

// function addSignalsPlugin() {
//     return {
//         name: "add-signals",
//         setup(build) {
//             build.onLoad({ filter: /\.jsx?$/ }, async (args) => {
//                 const fs = require("fs").promises;
//                 const source = await fs.readFile(args.path, "utf8");

//                 const transformed = source.replace(
//                     /function (\w+)\(props\) \{/g, // Matches functional components
//                     (match, componentName) => `
//             import { withSignals } from './signalSystem';
//             const ${componentName} = withSignals(function ${componentName}(props) {`
//                 );

//                 return { contents: transformed, loader: "jsx" };
//             });
//         },
//     };
// }

build({
    entryPoints: ["./signals.tsx"], // Your JSX entry file
    bundle: true, // Bundle all dependencies into one file
    outfile: "dist/bundle.js", // Output file
    minify: false, // Minify the output
    format: "esm", // Output as ES module
    jsx: "transform", // Convert JSX to JavaScript
    jsxFactory: "createElement", // Use your custom createElement function
})
    .then(() => {
        console.log("Build succeeded.");
    })
    .catch(() => {
        console.error("Build failed.");
    });
