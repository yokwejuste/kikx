#!/usr/bin/env sh
set -eu

REPOSITORY="${KIKX_REPOSITORY:-yokwejuste/kikx}"
VERSION="${KIKX_VERSION:-}"
INSTALL_DIR="${KIKX_INSTALL_DIR:-}"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'kikx install: %s\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

need curl
need tar
need uname

case "$(uname -s)" in
  Darwin) os="macos" ;;
  Linux) os="linux" ;;
  *) fail "unsupported system $(uname -s). On Windows, download kikx from https://github.com/${REPOSITORY}/releases/latest" ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) arch="x64" ;;
  arm64 | aarch64) arch="arm64" ;;
  *) fail "unsupported processor $(uname -m)" ;;
esac

if [ -z "$VERSION" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/${REPOSITORY}/releases/latest" \
    | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1)"
  [ -n "$VERSION" ] || fail "could not find the latest release of ${REPOSITORY}"
fi
number="${VERSION#v}"
name="kikx-${number}-${os}-${arch}"
url="https://github.com/${REPOSITORY}/releases/download/v${number}/${name}.tar.gz"

if [ -z "$INSTALL_DIR" ]; then
  if [ -w /usr/local/bin ]; then
    INSTALL_DIR="/usr/local/bin"
  elif command -v sudo >/dev/null 2>&1 && [ -d /usr/local/bin ]; then
    INSTALL_DIR="/usr/local/bin"
    use_sudo="yes"
  else
    INSTALL_DIR="${HOME}/.local/bin"
  fi
fi

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT INT TERM

say "Downloading kikx ${number} for ${os} ${arch}"
curl -fsSL "$url" -o "${workdir}/kikx.tar.gz" || fail "could not download ${url}"
tar -xzf "${workdir}/kikx.tar.gz" -C "$workdir"
[ -f "${workdir}/${name}/kikx" ] || fail "the archive does not contain kikx"

mkdir -p "$INSTALL_DIR" 2>/dev/null || true
if [ "${use_sudo:-}" = "yes" ]; then
  say "Installing to ${INSTALL_DIR} (sudo may ask for your password)"
  sudo install -m 0755 "${workdir}/${name}/kikx" "${INSTALL_DIR}/kikx"
else
  install -m 0755 "${workdir}/${name}/kikx" "${INSTALL_DIR}/kikx"
fi

say "Installed $("${INSTALL_DIR}/kikx" --version) to ${INSTALL_DIR}/kikx"

case ":${PATH}:" in
  *":${INSTALL_DIR}:"*)
    say "Run kikx to get started."
    exit 0
    ;;
esac

if [ "${KIKX_NO_MODIFY_PATH:-}" = "1" ]; then
  say "Add ${INSTALL_DIR} to your PATH, then run kikx to get started."
  exit 0
fi

case "$(basename "${SHELL:-sh}")" in
  zsh)
    profile="${HOME}/.zshrc"
    line="export PATH=\"${INSTALL_DIR}:\$PATH\""
    ;;
  bash)
    if [ "$os" = "macos" ]; then profile="${HOME}/.bash_profile"; else profile="${HOME}/.bashrc"; fi
    line="export PATH=\"${INSTALL_DIR}:\$PATH\""
    ;;
  fish)
    profile="${HOME}/.config/fish/config.fish"
    line="fish_add_path ${INSTALL_DIR}"
    ;;
  csh | tcsh)
    profile="${HOME}/.cshrc"
    line="setenv PATH \"${INSTALL_DIR}:\$PATH\""
    ;;
  *)
    profile="${HOME}/.profile"
    line="export PATH=\"${INSTALL_DIR}:\$PATH\""
    ;;
esac

mkdir -p "$(dirname "$profile")"
touch "$profile"
if grep -qsF "$line" "$profile"; then
  say "${profile} already adds ${INSTALL_DIR} to your PATH."
else
  printf '\n%s\n' "$line" >>"$profile"
  say "Added ${INSTALL_DIR} to your PATH in ${profile}."
fi
say "Open a new terminal, or run: source ${profile}"
say "Then run kikx to get started."
