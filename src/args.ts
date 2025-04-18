/**
 * Simple CLI argument parser.
 * Supported synopsis:
 * <command> [--<flag|option> [<value>]?]*
 */

const ARGS: string[] = process.argv.slice(2);


function argIndex(arg: string, shorthand: string = arg): number {
    return Math.max(ARGS.indexOf(`--${arg}`), ARGS.indexOf(`-${shorthand.toUpperCase()}`));
}


export function hasFlag(flag: string, shorthand?: string): boolean {
    return !!~argIndex(flag, shorthand);
}

export function parseOption(option: string, shorthand?: string): string {
    const index = argIndex(option, shorthand);
    return ~index ? ARGS[index + 1] : undefined;
}

export function parsePositional(position: number): string {
    return ARGS[position];
}