#!/usr/bin/env node
import { spawn } from "child_process";
import { join } from "path";
spawn("node", ["--disable-warning=ExperimentalWarning", join(import.meta.dirname, "./cli.js"), ...process.argv.slice(2)], {
    cwd: process.cwd(),
    stdio: "inherit",
    windowsHide: true
});
