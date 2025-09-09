/**
 * Simple CLI argument parser.
 * Supported synopsis:
 * <command> [--<flag|option> [<value>]?]*
 */
const ARGS = process.argv.slice(2);
function argIndex(arg, shorthand = arg) {
    return Math.max(ARGS.indexOf(`--${arg}`), ARGS.indexOf(`-${shorthand.toUpperCase()}`));
}
export function hasFlag(flag, shorthand) {
    return !!~argIndex(flag, shorthand);
}
export function parseOption(option, shorthand) {
    const index = argIndex(option, shorthand);
    return ~index ? ARGS[index + 1] : undefined;
}
export function parsePositional(position) {
    return ARGS[position];
}
//# sourceMappingURL=args.js.map