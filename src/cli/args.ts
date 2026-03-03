import argsSpec from "../../cli.args.json" with { type: "json" };


const ARGS: string[] = process.argv.slice(2);


interface ArgSpec {
	name: string;

	shorthand?: string;
}


function readArgsSpec(key: string): ArgSpec {
	const spec: ArgSpec | undefined = (argsSpec as Record<string, ArgSpec>)[key];

	if(!spec) throw new SyntaxError(`Key '${key}' not in arguments specification`);

	return (argsSpec as Record<string, ArgSpec>)[key];
}

function argIndex(key: string): number {
	const spec: ArgSpec = readArgsSpec(key);

	return Math.max(ARGS.indexOf(`--${spec.name}`), ARGS.indexOf(`-${spec.shorthand?.toUpperCase()}`));
}


export function hasFlag(key: string): boolean {
	return !!~argIndex(key);
}

export function parseOption(key: string): string {
	const index = argIndex(key);

	return ~index ? ARGS[index + 1] : undefined;
}

export function parsePositional(position: number): string {
	return ARGS[position];
}