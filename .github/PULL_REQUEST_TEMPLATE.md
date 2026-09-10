## What

<!-- What does this change, in one or two sentences? -->

## Why

<!-- What prompted it — a bug, a missing component, a rough edge? Link an issue if there is one. -->

## Testing

<!-- Commands you ran, or "none" if this is docs-only. -->

```bash

```

## Checklist

- [ ] `cargo test` passes for the packages I touched (`cli`, `backend`, `backend/core`)
- [ ] `cargo clippy --all-targets -- -D warnings` and `cargo fmt --check` pass for the packages I touched
- [ ] `npm run lint` and `npm run build` pass (if `web/` changed)
- [ ] New/changed components keep the "vendor real files" model — no generated-code comments telling the user not to touch the output
