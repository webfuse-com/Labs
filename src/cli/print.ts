import { hasFlag } from "./args.js";


/**
 * Intercept all uncaught errors and log according to log detail.
 * Log detail is message only by default.
 * --stacktrace enables verbose logs, i.e. full errors.
 */
const printError = (err: Error) => {
	console.error(`\x1b[31m\n${
		hasFlag("stacktrace") ? err.stack : err.message
	}\x1b[0m`);

	process.exit(1);
};
process.on("uncaughtException", printError);
process.on("unhandledRejection", printError);


export function print(
	message: string,
	replaceLastLine: boolean = false,
	subtle: boolean = false,
	noTimestamp: boolean = false
) {
	console.log(`${
		replaceLastLine ? `\x1b[1A\x1b[2K` : ""
	}\x1b[2m${
		!noTimestamp
			? `[${
				new Date().toLocaleString(
					Intl.DateTimeFormat().resolvedOptions().locale, {
						hour: "numeric", minute: "numeric", second: "numeric"
					}
				)
			}] `
			: ""
	}\x1b[0m${
		!subtle ? "\x1b[38;2;222;74;183m" : ""
	}${
		message
	}\x1b[0m`);
}