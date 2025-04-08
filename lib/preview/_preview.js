import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { createServer } from "http";

import { WebSocketServer } from "ws";

import { DIST_PATH } from "../constants.js";

import _config from "./config.json" with { type: "json" };


const MIME = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".png": "image/png"
};


const readDoc = (path, rootPath = import.meta.dirname) => {
    const absolutePath = join(rootPath, path);
    return existsSync(absolutePath)
        ? readFile(absolutePath)
        : null;
}

const injectPriorityScript = (markup, src) => {
    return markup
        .replace(/(<head[^>]*>(\n? *))/i, `$1<script src="${src}"></script>$2`);
}

const routes = {
    "/": {
        data: await readDoc("/assets/preview.html"),
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
            ${(await readDoc("background.js", DIST_PATH)).toString()}
        })();`,
        mime: "text/javascript"
    }
};


function createHTTPServer(port) {
    return new Promise(resolve => {
        createServer(async (req, res) => {
            const end = (data, mime = "text/html", status = 200) => {
                res.statusCode = status;
                res.setHeader("Content-Type", mime);
                res.end(data);
            };

            try {
                if(routes[req.url])
                    return end(routes[req.url].data, routes[req.url].mime);

                const assetFile = await readDoc(req.url);
                if(assetFile)
                    return end(assetFile, MIME[extname(req.url)]);

                let distFile = await readDoc(req.url, DIST_PATH);
                if(!distFile)
                    return end(await readDoc("/assets/404.html"), null, 404);

                distFile = distFile.toString();
                if([ "/newtab.html", "/popup.html" ].includes(req.url)) {
                    if([ "/newtab.html" ].includes(req.url)) {
                        distFile = injectPriorityScript(distFile, "/content.js");
                    }
                    distFile = injectPriorityScript(distFile, "/assets/mock.js");
                }
                return end(distFile, MIME[extname(req.url)]);
            } catch(err) {
                end(null, null, 500);

                console.error(err);
            }
        })
            .listen(port, () => resolve());
    });
}

function createWSServer() {
    const wss = new WebSocketServer({ port: _config.portWs });
    wss.on("connection", ws => {
        ws.on("error", console.error);
        ws.send("init");
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
            handle: await createWSServer(_config.portWs),
            port: _config.portWs
        }
    };
}