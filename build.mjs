import chokidar from "chokidar";
import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "path";

import { WebSocketServer } from "ws";

const isProd =
    process.env.NODE_ENV === "production" ||
    process.argv.some(
        (arg) => arg.startsWith("--build") && arg.endsWith("true")
    );
const buildOptions = {
    entryPoints: ["./src/Main.tsx"], // Your JSX entry file
    bundle: true, // Bundle all dependencies into one file
    outfile: "dist/bundle.js", // Output file
    minify: false, // Minify the output
    format: "esm", // Output as ES module
    jsx: "transform", // Convert JSX to JavaScript
    jsxFactory: "createElement", // Use your custom createElement function,
    jsxFragment: '"Fragment"',
    inject: [path.join(import.meta.dirname, "./signals.ts")],
};
const injectHtml = async () => {
    try {
        const index = await fs.readFile(
            path.join(import.meta.dirname, "./index.html"),
            "utf-8"
        );
        const injectWSScript = index.replace(
            "</body>",
            `
              <script>
                const ws = new WebSocket("ws://localhost:3001");
                ws.onmessage = (event) => {
                  if (event.data === "reload") {
                    window.location.reload();
                  }
                };
              </script>
            </body>
            `
        );
        await fs.writeFile(
            path.join(import.meta.dirname, "./dist/index.html"),
            injectWSScript
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
        .watch(["./src", "./signals.ts", "./index.html"])
        .on("change", async (path) => {
            if (path === "index.html") {
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
