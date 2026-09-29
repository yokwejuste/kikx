# Security policy

## Supported versions

Security fixes go into the latest release of the `kikx` CLI and into the hosted dashboard. Older
releases are not patched; upgrade to the latest release from the
[releases page](https://github.com/yokwejuste/kikx/releases/latest).

| Component | Supported |
|-|-|
| Latest CLI release | Yes |
| Older CLI releases | No |
| Hosted dashboard and backend | Yes |
| `main` branch | Best effort |

## Reporting a vulnerability

Please do not open a public issue, discussion or pull request for a security problem.

Report it privately, either:

- by email to [steve@yokwejuste.me](mailto:steve@yokwejuste.me), or
- through GitHub's [private vulnerability reporting](https://github.com/yokwejuste/kikx/security/advisories/new).

Include what you can of:

- the affected component (CLI, backend, dashboard, a template or a preset) and version or commit;
- the steps to reproduce, with a minimal registry item, preset or request if one is involved;
- what an attacker gains, for example reading or writing files outside the output folder.

## What happens next

- You get an acknowledgement within 3 working days.
- We confirm the problem, agree on its severity with you and keep you updated while a fix is prepared.
- The fix ships in a new release, followed by a GitHub security advisory. You are credited unless
  you ask not to be.

Please give us a reasonable time to release a fix before disclosing the problem publicly.

## Scope

In scope:

- the `kikx` CLI, including how it resolves registry items and presets from paths and URLs and
  where it writes files;
- the backend HTTP API and its CORS handling;
- the dashboard, including imported inventories and presets;
- the built-in templates and presets, when they render unsafe output from safe input.

Out of scope:

- a backend you run yourself and expose beyond `127.0.0.1`: it has no authentication by design, as
  described in [CONTRIBUTING.md](CONTRIBUTING.md#configuration);
- the content of files kikx vendors into your project once you have edited them;
- vulnerabilities in third-party dependencies that are already publicly known, unless kikx uses
  them in an exploitable way.
