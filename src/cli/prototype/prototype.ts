import { join, resolve, extname } from "path";
import { createServer } from "http";
import { stat, readFile } from "fs/promises";

import { print } from "../print.js";


const PROTOTYPING_SERVER_PORT: number = 5000;
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


export async function prototype(extensionBundleDirectoryPath: string): Promise<void> {
	const absoluteExtensionBundleDirectoryPath: string = resolve(extensionBundleDirectoryPath);

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

			const absoluteBundleFilePath: string = join(absoluteExtensionBundleDirectoryPath, req.url);

			tryServeFile(absoluteBundleFilePath);
		})
			.listen(PROTOTYPING_SERVER_PORT, () => {
				print(`Prototyping server running at \x1b[1mhttp://localhost:${PROTOTYPING_SERVER_PORT}\x1b[0m`);

				resolve();
			});
	});
}