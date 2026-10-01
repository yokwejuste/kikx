import packageJson from "../../package.json" with { type: "json" };

export const REPOSITORY_URL = packageJson.repository.url;
export const REPOSITORY = new URL(REPOSITORY_URL).pathname.replace(/^\/|\.git$/g, "");
export const INSTALL_COMMAND = `curl -fsSL https://raw.githubusercontent.com/${REPOSITORY}/main/install.sh | bash`;
