import chokidar from "chokidar";
import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "path";

import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd =
    process.env.NODE_ENV === "production" ||
    process.argv.some(
        (arg) => arg.startsWith("--build") && arg.endsWith("true")
    );
const buildOptions = {
    entryPoints: ["./src/components/Main.tsx"], // Your JSX entry file
    bundle: true, // Bundle all dependencies into one file
    splitting: true,
    outdir: isProd ? "build" : "dist", // Output file
    minify: false, // Minify the output
    format: "esm", // Output as ES module
    jsx: "transform", // Convert JSX to JavaScript
    jsxFactory: "createElement", // Use your custom createElement function,
    jsxFragment: '"FRAGMENT"',
    inject: [path.join(__dirname, "./src/rendering/createElements.ts")],
};
const injectHtml = async () => {
    try {
        const outputDir = path.join(__dirname, isProd ? "build" : "dist");

        // Ensure the output directory exists before writing
        await fs.mkdir(outputDir, { recursive: true });

        const index = await fs.readFile(
            path.join(__dirname, "./public/index.html"),
            "utf-8"
        );
        const injectWSScript = index.replace(
            "</body>",
            `
            <script>
              const ws = new WebSocket("ws://localhost:3001");
              ws.onmessage = (event) => {
                if (event.data === "reload") window.location.reload();
              };
            </script>
            </body>
            `
        );

        await fs.writeFile(
            path.join(outputDir, "index.html"),
            injectWSScript,
            "utf-8"
        );
    } catch (err) {
        console.error("Error updating index.html:", err);
    }
};

async function dev() {
    const context = await esbuild.context(buildOptions);

    const wss = new WebSocketServer({ port: 3001 });
    // wss.on("connection", (ws) => {
    //     console.log("Browser connected to ws.");
    // });

    const broadcastReload = () => {
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send("reload");
            }
        });
    };
    await injectHtml();
    await context.serve({ port: 3000, servedir: "./dist" });

    console.log("Server Listening on http://localhost:3000");

    chokidar
        .watch(["./src", "./signals.ts", "./public/index.html"])
        .on("change", async (path) => {
            if (path === "public/index.html") {
                console.log(`${path} changed, rebuilding...`);
                await injectHtml();
                console.log("Server Listening on http://localhost:3000");
            } else {
                console.log(`${path} changed, rebuilding...`);
                await context.rebuild();
                console.log("Server Listening on http://localhost:3000");
            }
            broadcastReload();
        });
    console.log("Watching for changes...");
}
if (isProd) {
    buildOptions.minify = true;
    injectHtml()
        .then(() => {
            esbuild.build(buildOptions).catch((err) => {
                console.error(err);
                process.exit(1);
            });
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
} else {
    dev().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
