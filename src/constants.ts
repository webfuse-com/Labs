/**
 * Framework constants, and computed constants for CWD.
 */

import { resolve, join } from "path";

import { parseOption } from "./cli/args.js";


export const ROOT_PATH: string = resolve(parseOption("working-dir") ?? ".");
export const SRC_DIR: string = "src";
export const DIST_DIR: string = "dist";
export const STATIC_DIR: string = "static";
export const SRC_PATH: string = join(ROOT_PATH, SRC_DIR);
export const DIST_PATH: string = join(ROOT_PATH, DIST_DIR);
export const STATIC_PATH: string = join(ROOT_PATH, STATIC_DIR);
export const TARGET_DIRS: string[] = [ "newtab", "popup" ];