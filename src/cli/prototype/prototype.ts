import { join, resolve, extname } from "path";
import { createServer } from "http";
import { stat, readFile } from "fs/promises";

import { createHash } from "crypto";


const PROTOTYPING_SERVER_HTTP_PORT: number = 5000;
const PROTOTYPING_SERVER_WS_PORT: number = 7654;
const ABSOLUTE_PROTOTYPING_APP_DIRECTORY_PATH: string = join(import.meta.dirname, "../../prototype-app");
const URL_PREFIX_REGEX: RegExp = /^\/@([a-z]+)(?=\/)/i;
const URL_PREFIX_APP: string = "app";

const MIME_TYPES: Record<string, string> = {
	"css": "text/css",
	"gif": "image/gif",
	"html": "text/html",
	"htm": "text/html",
	"ico": "image/vnd.microsoft.icon",
	"js": "application/javascript",
	"json": "application/json",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"otf": "font/otf",
	"png": "image/png",
	"svg": "image/svg+xml",
	"ttf": "font/ttf",
	"txt": "text/plain",
	"webp": "image/webp",
	"woff": "font/woff",
	"woff2": "font/woff2"
};

const WS_MESSAGE_CONNECTED: number = 0;
const WS_MESSAGE_RELOAD: number = 1;


interface WSServerHandler {
	sendRefresh: () => void;
}


function createHTTPServer(absoluteExtensionBundleDirectoryDistPath: string): Promise<void> {
	return new Promise(resolve => {
		createServer((req, res) => {
			const endSuccess = (body: string | Buffer, mimeType?: string) => {
				res.writeHead(200, {
					"Content-Type": mimeType
				});
				res.end(body);
			};
			const endError = (status: number = 404, message?: string) => {
				res.writeHead(status);
				res.end(message);
			};

			const tryServeFile = async (absoluteFilePath: string) => {
				try {
					await stat(absoluteFilePath);

					endSuccess(
						await readFile(absoluteFilePath),
						MIME_TYPES[extname(absoluteFilePath).slice(1)]
					);
				} catch(err) {
					((err as NodeJS.ErrnoException)?.code === "ENOENT")
						? endError(404)
						: endError(400, (err as Error)?.message ?? String(err));
				}
			};

			if(req.url === "/") {
				tryServeFile(join(ABSOLUTE_PROTOTYPING_APP_DIRECTORY_PATH, "index.html"));

				return;
			}

			const prefix: string = (req.url.match(URL_PREFIX_REGEX) ?? [ "" ])[1];
			const normalizedURLPathname: string = req.url.replace(URL_PREFIX_REGEX, "");
			switch(prefix) {
				case URL_PREFIX_APP: {
					const absoluteAppFilePath: string = join(ABSOLUTE_PROTOTYPING_APP_DIRECTORY_PATH, normalizedURLPathname);

					tryServeFile(absoluteAppFilePath);

					return;
				}
			}

			const absoluteBundleFilePath: string = join(absoluteExtensionBundleDirectoryDistPath, req.url);

			tryServeFile(absoluteBundleFilePath);
		})
			.listen(PROTOTYPING_SERVER_HTTP_PORT, resolve);
	});
}

function createWSServer(): Promise<WSServerHandler> {
	const clients: Set<{
		writable: boolean;
		write: (buffer: Buffer) => void;
	}> = new Set();

	const createMessageFrame = (message: number) => {
		const payload = Buffer.from(message.toString());
		const header = Buffer.from([ 0x81, payload.length ]);
		const frame = Buffer.concat([ header, payload ]);

		return frame;
	};

	return new Promise(resolve => {
		createServer()
			.on("upgrade", (req, socket) => {
				if(req.headers.upgrade?.toLowerCase() !== "websocket") {
					socket.end("HTTP/1.1 400 Bad Request");

					return;
				}

				const key = req.headers["sec-websocket-key"];
				if(!key || Array.isArray(key)) {
					socket.end("HTTP/1.1 400 Bad Request");

					return;
				}

				// Websocket handshake
				const acceptKey = createHash("sha1")
					.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
					.digest("base64");

				const responseHeaders = [
					"HTTP/1.1 101 Switching Protocols",
					"Upgrade: websocket",
					"Connection: Upgrade",
					`Sec-WebSocket-Accept: ${acceptKey}`,
				];

				socket.write(responseHeaders.join("\r\n") + "\r\n".repeat(2));

				clients.add(socket);

				socket.write(createMessageFrame(WS_MESSAGE_CONNECTED));

				socket.on("close", () => clients.delete(socket));
				socket.on("end", () => clients.delete(socket));
				socket.on("error", () => clients.delete(socket));
			})
			.listen(PROTOTYPING_SERVER_WS_PORT, () => resolve({
				sendRefresh: () => {
					const frame = createMessageFrame(WS_MESSAGE_RELOAD);

					for(const socket of clients) {
						if(!socket.writable) continue;

						socket.write(frame);
					}
				}
			}));
	});
}


export async function prototype(extensionBundleDirectoryPath: string): Promise<{
	appPort: number;
	wsServerHandler: WSServerHandler;
}> {
	const absoluteExtensionBundleDirectoryDistPath: string = resolve(extensionBundleDirectoryPath, "./dist");

	await createHTTPServer(absoluteExtensionBundleDirectoryDistPath);
	const wsServerHandler = await createWSServer();

	return {
		appPort: PROTOTYPING_SERVER_HTTP_PORT,
		wsServerHandler
	};
}