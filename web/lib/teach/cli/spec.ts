export interface FlagSpec {
  long: string;
  short?: string;
  value?: string;
  multiple?: boolean;
  keyValue?: boolean;
  numeric?: boolean;
  required?: boolean;
}

export interface CommandSpec {
  name: string;
  about: string;
  positional?: string;
  flags: FlagSpec[];
}

const force: FlagSpec = { long: "force", short: "f" };

export const COMMANDS: CommandSpec[] = [
  {
    name: "init",
    about: "Create kikx.toml in the current directory",
    flags: [
      { long: "name", short: "n", value: "NAME" },
      { long: "dir", short: "d", value: "DIR" },
      { long: "namespace", short: "N", value: "NAMESPACE" },
      force,
    ],
  },
  {
    name: "add",
    about: "Render a component and write its files into the project",
    positional: "REFERENCE",
    flags: [
      { long: "name", short: "n", value: "NAME", required: true },
      { long: "image", short: "i", value: "IMAGE" },
      { long: "replicas", short: "r", value: "REPLICAS", numeric: true },
      { long: "port", short: "p", value: "PORT", numeric: true },
      { long: "target-port", short: "t", value: "TARGET_PORT", numeric: true },
      { long: "namespace", short: "N", value: "NAMESPACE" },
      { long: "host", short: "H", value: "HOST" },
      { long: "path", short: "P", value: "PATH" },
      { long: "service", short: "S", value: "SERVICE" },
      { long: "label", short: "l", value: "LABELS", multiple: true, keyValue: true },
      { long: "set", short: "s", value: "SET", multiple: true, keyValue: true },
      force,
    ],
  },
  { name: "list", about: "List the built-in components with their fields", flags: [] },
  { name: "presets", about: "List the built-in preset templates", flags: [] },
  {
    name: "setup",
    about: "Bootstrap a new project from a preset template, file or URL",
    positional: "REFERENCE",
    flags: [force],
  },
  {
    name: "apply",
    about: "Vendor a preset template, file or URL into an existing project",
    positional: "REFERENCE",
    flags: [{ long: "into", short: "i", value: "INTO" }, force],
  },
  {
    name: "upgrade",
    about: "Upgrade kikx to the latest release",
    flags: [
      { long: "check", short: "c" },
      { long: "version", short: "v", value: "VERSION" },
    ],
  },
];

export const ABOUT = "Vendor real, editable infrastructure files into your project";

export const SHELL_COMMANDS = ["ls", "cat", "clear"];

export function commandSpec(name: string): CommandSpec | undefined {
  return COMMANDS.find((command) => command.name === name);
}

export function flagWords(): Record<string, string> {
  const words = COMMANDS.flatMap((command) => command.flags).map((flag) => {
    const name = flag.long.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
    return [`flag${name}`, `--${flag.long}`] as const;
  });
  return Object.fromEntries(words);
}

export function flagLabel(flag: FlagSpec): string {
  return flag.value ? `--${flag.long} <${flag.value}>` : `--${flag.long}`;
}
