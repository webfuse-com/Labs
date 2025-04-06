#!/usr/bin/env node


import { existsSync, readFileSync } from "fs";
import { join, normalize } from "path";

import { ROOT_PATH, SRC_DIR } from "./constants.js";
import { hasFlag, parseOption, parsePositional } from "./args.js";
import { create } from "./create/_create.js";
import { bundle } from "./bundle/_bundle.js";
import { preview } from "./preview/_preview.js";


const printError = err => {
    console.error(`\x1b[31m\n${
        hasFlag("stacktrace") ? err.stack : err.message
    }\x1b[0m`);

    process.exit(1);
};
process.on("uncaughtException", printError);
process.on("unhandledRejection", printError);


const print = (message, replaceLastLine = false) => {
    console.log(`${
            replaceLastLine ? `\x1b[1A\x1b[2K` : ""
        }\x1b[2m[${new Date().toLocaleString(
            Intl.DateTimeFormat().resolvedOptions().locale, {
                hour: "numeric", minute: "numeric", second: "numeric"
            }
        )}]\x1b[0m \x1b[38;2;222;74;183m${
            message
        }\x1b[0m`);
};


const cmd = parsePositional(0);
if(!cmd)
    throw new SyntaxError("Missing command. Run command 'help' for a list of available commands.");


const checkExtensionDir = () => {
    if(!existsSync(join(ROOT_PATH, "package.json")))
        throw new SyntaxError("Extension directory requires a valid package.json");
    if(!existsSync(join(ROOT_PATH, SRC_DIR)))
        throw new SyntaxError(`Extension directory requires a ${normalize(`/${SRC_DIR}`)} source directory`);
};

const cmdBundle = async (cb = () => {}) => {
    print("Bundle extension...");

    const emitter = await bundle(hasFlag("debug", "D"));

    emitter.on("bundle", stats => {
        const normalizePath = path => {
            path = normalize(path);
            return normalize(path.slice(normalize(process.cwd()).length));
        };

        print(
            `Bundled extension \x1b[2m(${normalizePath(stats.src)} → ${normalizePath(stats.dist)}, ${stats.count} files, ${stats.ms}ms)\x1b[22m.`,
            true
        );

        cb();
    });

    return emitter;
};

switch(cmd) {
    case "help":
        console.log(
            readFileSync(join(import.meta.dirname, "help.txt")).toString()
                .replace(/(Webfuse|Labs)/g, "\x1b[1m$1\x1b[0m")
                .replace(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/g, "\x1b[38;2;222;74;183m$1\x1b[0m")
        );
        break;
    case "create":
        const emitPath = await create(parseOption("path", "P"));
        print(`Created extension project blueprint at \x1b[1m${emitPath}\x1b[22m.`);
        break;
    case "bundle":
        checkExtensionDir();

        (await cmdBundle())
            .once("bundle", () => !hasFlag("watch", "W") && process.exit(0));
        break;
    case "preview":
        checkExtensionDir();

        const serverInfo = await preview();

        print(`Preview available at \x1b[1m\x1b[4mhttp://localhost:${serverInfo.http.port}\x1b[22m\x1b[24m.`);

        !hasFlag("only")
            && cmdBundle(() => serverInfo.ws.handle.push());

        break;
    default:
        throw new SyntaxError(`Invalid command '${cmd}'. Run command 'help' for a list of available commands.`);
}