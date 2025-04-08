/**
 * Framework constants, and computed constants for CWD.
 */

import { resolve, join } from "path";

import { parseOption } from "./args.js";


export const ROOT_PATH = resolve(parseOption("working-dir") ?? ".");
export const SRC_DIR = "src";
export const DIST_DIR = "dist";
export const ASSETS_DIR = "assets";
export const SRC_PATH = join(ROOT_PATH, SRC_DIR);
export const DIST_PATH = join(ROOT_PATH, DIST_DIR);
export const ASSETS_PATH = join(ROOT_PATH, ASSETS_DIR);
export const TARGET_DIRS = [ "newtab", "popup" ];