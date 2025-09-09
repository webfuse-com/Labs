/**
 * Asset read utilities.
 */
import { join } from "path";
export function getAssetPath(command, relativePath) {
    return join(import.meta.dirname, "../../assets/", command, relativePath);
}
//# sourceMappingURL=assets.js.map