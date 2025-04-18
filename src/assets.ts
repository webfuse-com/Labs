/**
 * Asset read utilities.
 */

import { join } from "path";


export function getAssetPath(command: string, relativePath: string): string {
    return join(import.meta.dirname, "../assets/", command, relativePath);
}