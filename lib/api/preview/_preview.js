import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { DIST_PATH } from "../../constants.js";
import { getAssetPath } from "../assets.js";
import _config from "./config.json" with { type: "json" };
const MIME = {
    ".aac": "audio/aac",
    ".css": "text/css",
    ".gif": "image/gif",
    ".html": "text/html",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".json": "aplication/json",
    ".js": "text/javascript",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".mpeg": "video/mpeg",
    ".ogg": "video/ogg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
    ".webm": "audio/webm",
    ".webp": "image/webp",
    ".xml": "application/xml"
};
const readDoc = (path, rootPath = join(import.meta.dirname)) => {
    const absolutePath = join(rootPath, path);
    return existsSync(absolutePath)
        ? readFile(absolutePath)
        : null;
};
const injectPriorityScript = (markup, src) => {
    return markup
        .replace(/(<head[^>]*>(\n? *))/i, `$1<script src="${src}"></script>$2`);
};
const injectPriorityScriptRaw = (markup, script) => {
    return markup
        .replace(/(<head[^>]*>(\n? *))/i, `$1<script>${script}</script>$2`);
};
function createHTTPServer(port) {
    return new Promise(resolve => {
        createServer(async (req, res) => {
            const routes = {
                "/": {
                    data: await readDoc("preview.html", getAssetPath("preview", "./_assets/")),
                    mime: "text/html"
                },
                "/ws": {
                    data: `http://localhost:${_config.portWs}`,
                    mime: "text/plain"
                },
                "/background": {
                    data: `(() => {
                        const document = undefined;
                        const window = undefined;
                        ${((await readDoc("background.js", DIST_PATH) ?? "")).toString()}
                    })();`,
                    mime: "text/javascript"
                }
            };
            const end = (data, mime = "text/html", status = 200) => {
                res.statusCode = status;
                res.setHeader("Content-Type", mime);
                res.end(data);
            };
            try {
                if (routes[req.url])
                    return end(routes[req.url].data, routes[req.url].mime);
                const assetFile = await readDoc(req.url, getAssetPath("preview", "."));
                if (assetFile)
                    return end(assetFile, MIME[extname(req.url)]);
                let distFile = await readDoc(req.url, DIST_PATH);
                if (!distFile)
                    return end(await readDoc("404.html"), null, 404);
                if (["/newtab.html", "/popup.html"].includes(req.url)) {
                    distFile = distFile.toString();
                    if (["/newtab.html"].includes(req.url)) {
                        distFile = injectPriorityScript(distFile, "/content.js");
                        distFile = injectPriorityScript(distFile, "/_assets/api/mock.content.js");
                    }
                    else {
                        distFile = injectPriorityScript(distFile, "/_assets/api/mock.other.js");
                    }
                    distFile = injectPriorityScriptRaw(distFile, `
						browser.virtualSession.env = ${JSON.stringify(Object.fromEntries((JSON.parse(((await readDoc("manifest.json", DIST_PATH)) ?? "{}").toString()).env ?? []).map(item => [item.key, item.value])))}`);
                    distFile = injectPriorityScript(distFile, "/_assets/api/mock.js");
                }
                return end(distFile, MIME[extname(req.url)]);
            }
            catch (err) {
                end(null, null, 500);
                console.error(err);
            }
        })
            .listen(port, () => resolve());
    });
}
function createWSServer(port) {
    const wss = new WebSocketServer({ port });
    wss.on("connection", ws => {
        ws.on("error", console.error);
        ws.send("init");
        ws.on("message", msg => {
            console.log(msg);
        });
    });
    return {
        push: () => wss.clients
            .forEach(client => client.send("reload"))
    };
}
export async function preview() {
    return {
        http: {
            handle: await createHTTPServer(_config.portHttp),
            port: _config.portHttp
        },
        ws: {
            handle: createWSServer(_config.portWs),
            port: _config.portWs
        }
    };
}
