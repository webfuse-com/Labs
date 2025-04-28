/**
 * Preview handler module.
 * Command invokes preview().
 * Spins up the preview enviornment, which is a locally served web app.
 */

import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { createServer } from "http";

import { WebSocketServer } from "ws";

import { DIST_PATH } from "../constants.js";
import { getAssetPath } from "../assets.js";

import _config from "./config.json" with { type: "json" };


const MIME: Record<string, string> = {
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

/**
 * Read data from a file to serve in preview.
 */
const readDoc = (path: string, rootPath = join(import.meta.dirname)): Promise<null|string> => {
	const absolutePath: string = join(rootPath, path);
	return existsSync(absolutePath)
		? (readFile(absolutePath) as unknown as Promise<string>)
		: null;
}

/**
 * Inject a script tag with a given src at the top of a document's inner head.
 * Required with script scope constraints.
 * For instance, the content script is injected to newtab.html (only).
 * The mock API script, on the other hand, is injected into any document.
 */
const injectPriorityScript = (markup: string, src: string) => {
	return markup
        .replace(/(<head[^>]*>(\n? *))/i, `$1<script src="${src}"></script>$2`);
}


/**
 * Spin up the HTTP server for the preview app.
 */
function createHTTPServer(port: number) : Promise<void>{
	return new Promise(resolve => {
		createServer(async (req, res) => {
			const routes: Record<string, {
                data: string;
                mime: string;
            }> = {
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

			const end = (data: string, mime = "text/html", status = 200) => {
				res.statusCode = status;
				res.setHeader("Content-Type", mime);
				res.end(data);
			};

			try {
				if(routes[req.url])
					return end(routes[req.url].data, routes[req.url].mime);

				const assetFile = await readDoc(req.url, getAssetPath("preview", "."));
				if(assetFile)
					return end(assetFile, MIME[extname(req.url)]);

				let distFile = await readDoc(req.url, DIST_PATH);
				if(!distFile)
					return end(await readDoc("404.html"), null, 404);

				if([ "/newtab.html", "/popup.html" ].includes(req.url)) {
					distFile = distFile.toString();
					if([ "/newtab.html" ].includes(req.url)) {
						distFile = injectPriorityScript(distFile, "/content.js");
						distFile = injectPriorityScript(distFile, "/_assets/api/mock.content.js");
					} else {
						distFile = injectPriorityScript(distFile, "/_assets/api/mock.other.js");
					}
					distFile = injectPriorityScript(distFile, "/_assets/api/mock.js");
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

/**
 * Spin up the websocket server for the preview app.
 * Enables hot module replacement within all active preview clients.
 * Returns an interface to push a refresh request to each connected client.
 */
function createWSServer(port: number) {
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


/**
 * CLI command handler interface.
 * Invoked from entry module.
 */
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


/*

curl -X 'GET' \
  'https://surfly.online/api/company/users/' \
  -H 'accept: application/json' \
  -H 'Authorization: Token ck_***'

curl -X 'POST' \
  'https://surfly.online/api/spaces/' \
  -H 'accept: application/json' \
  -H 'Authorization: Token ck_***' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "labs-foo",
  "slug": "labs-foo",
  "type": "solo",
  "visibility": "members-only",
  "access_control": "public",
  "identification": "anonymous",
  "queue_enabled": false,
  "is_paused": false,
  "host_rights": "everyone",
  "enable_parallel_sessions": true,
  "is_landing_page_published": false
}'

curl -X 'POST' \
  'https://surfly.online/api/spaces/657/members/' \
  -H 'accept: application/json' \
  -H 'Authorization: Token ck_***' \
  -H 'Content-Type: application/json' \
  -d '{
  "space": 657,
  "member": 87,
  "role": "admin"
}'

curl -X 'POST' \
  'https://surfly.online/api/spaces/657/sessions/' \
  -H 'accept: application/json' \
  -H 'Authorization: Token rk_***' \
  -d '{
  "headless": true
}'

*/