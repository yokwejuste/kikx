## What

## Why

## Testing

```bash

```

## Checklist

- [ ] `cargo test` passes for the packages I touched (`cli`, `backend`, `backend/core`)
- [ ] `RUSTFLAGS="-D warnings" cargo clippy --all-targets` and `cargo fmt --check` pass for the packages I touched
- [ ] `npm run lint` and `npm run build` pass (if `web/` changed)
- [ ] New/changed components keep the "vendor real files" model — no generated-code comments telling the user not to touch the output
