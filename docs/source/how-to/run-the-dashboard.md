# Run the dashboard and backend

The dashboard (`web/`) is a Next.js app that renders everything through the kikx backend (`backend/`). You need both running.

## Start both with the defaults

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
```

In one terminal:

```bash
cd backend
cargo run
```

It prints `kikx-backend listening on http://127.0.0.1:4000`.

In a second terminal:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

The backend loads `.env` from the directory you start it in, so run `cargo run` from inside `backend/`.

## Use a different port or address

Edit `backend/.env`:

```dotenv
KIKX_PORT=4100
KIKX_BIND=127.0.0.1
KIKX_ALLOWED_ORIGINS=
```

Then point the dashboard at it in `web/.env.local`:

```dotenv
NEXT_PUBLIC_KIKX_API_URL=http://localhost:4100
```

Restart `npm run dev` after changing `web/.env.local`. Next.js reads `NEXT_PUBLIC_*` variables when it starts.

Flags override the file for a single run:

```bash
cargo run -- --port 4100 --bind 127.0.0.1
```

## Allow a non-local browser origin

With `KIKX_ALLOWED_ORIGINS` empty, the backend accepts any loopback origin (`localhost`, `127.0.0.1`, `[::1]`) on any port. Any other origin is refused.

If you open the dashboard from another host name, list every origin that should work, comma-separated:

```dotenv
KIKX_ALLOWED_ORIGINS=https://kikx.example.com,http://localhost:3000
```

Once you set a list, only those exact origins are allowed. Loopback is no longer allowed automatically, so add it back if you still need it.

The backend has no authentication. Keep it bound to `127.0.0.1` unless you trust everything that can reach the port.

## Check it's working

```bash
curl http://localhost:4000/api/health
```

This returns `ok`. If the dashboard shows **Can't reach the kikx backend**, check that `NEXT_PUBLIC_KIKX_API_URL` matches the backend's address and that the dashboard's origin is allowed. Then click **Try again**.

## See also

- [Configuration reference](../reference/configuration.md)
- [HTTP API reference](../reference/http-api.md)
- [How the pieces fit together](../explanation/project-layout.md)
