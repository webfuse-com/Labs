type CommandCallback = () => void;


export class CommandRegistry {
	private readonly registry: Map<string, CommandCallback> = new Map();

	public register(command: string, callbackCb: CommandCallback) {
		this.registry.set(command, callbackCb);
	}

	public invokeCommand(command: string) {
		if(!this.registry.has(command))
			throw new SyntaxError(`Unknown command '${command}' Run command 'help' to see a list of available commands.`);

		this.registry.get(command).call(null);
	}
}