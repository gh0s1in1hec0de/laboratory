interface ICommand {
  command: string,
  description: string,
}

export const commands: ICommand[] = [
    { command: "start", description: "start the bot" },
    { command: "list_tokens", description: "get actual token launches" },
];