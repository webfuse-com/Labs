import { resolve, join } from "path";

import { parseOption } from "./args.js";


export const ROOT_PATH = resolve(parseOption("working-dir") ?? ".");
export const SRC_DIR = "src";
export const DIST_DIR = "dist";
export const SRC_PATH = join(ROOT_PATH, SRC_DIR);
export const DIST_PATH = join(ROOT_PATH, DIST_DIR);