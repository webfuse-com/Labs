import { createInterface } from "readline";
import { writeFileSync } from "fs";
import { join } from "path";

import packageJson from "./package.json" with { type: "json" };


setImmediate(() => {
    createInterface(process.stdin, process.stdout)
        .question(`\x1b[33mSpecify version bump \x1b[2m(major|minor|patch)\x1b[22m:\x1b[0m\n`, answer => {
            const typeIndex = [ "major", "minor", "patch" ].indexOf(answer.trim());
            if(!~typeIndex) {
                console.error("\x1b[31mAborted.\x1b[0m");

                process.exit(0);
            }

            const version = packageJson.version.split(/\./g);

            version[typeIndex] = parseInt(version[typeIndex]) + 1;
            for(let i = typeIndex + 1; i < 3; i++) {
                version[i] = 0;
            }

            packageJson.version = version.join(".");

            writeFileSync(join(import.meta.dirname, "package.json"), JSON.stringify(packageJson, null, 2));

            console.log(`New version: \x1b[32m${packageJson.version}\x1b[0m`);
            console.log(`\x1b[31m\x1b[2mCreate GitHub Release:\x1b[22m https://github.com/surfly/labs/releases/new?tag=${packageJson.version}&title=${packageJson.version}`);

            process.exit(0);
        });
});