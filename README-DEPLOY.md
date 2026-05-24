# GMTT Dashboard — deployment

A static site (HTML + JSX + CSS) served by nginx. Bundled with:

- **`Dockerfile`** — `nginx:1.27-alpine`, ~25 MB
- **`docker-compose.yml`** — one-command run
- **`docker/nginx.conf`** + **`docker/entrypoint.sh`** — gzip, healthcheck,
  optional basic auth layer

## Default credentials (in-app login)

| Field    | Value             |
|----------|-------------------|
| Email    | `gmtt@aiingo.com` |
| Password | `Gmtt*2027*ai`    |

The in-app `login.html` is UI only — the password's SHA-256 hash is in the
source, so anyone can read it. **For real protection, also enable nginx
basic auth** (below).

---

## Run with Docker

### Quick start

```sh
docker compose up -d --build
# → http://localhost:8080  (lands on login.html)
```

Or with plain Docker:

```sh
docker build -t gmtt-dashboard .
docker run -d --name gmtt -p 8080:80 gmtt-dashboard
```

### With nginx Basic Auth (recommended)

Two-layer auth: nginx asks for HTTP basic creds first, then the in-app
login page asks for the app creds.

```sh
# Generate an htpasswd line with bcrypt
HTPASSWD=$(htpasswd -nbB gmtt 'your-strong-password')

docker run -d --name gmtt -p 8080:80 \
  -e BASIC_AUTH=1 \
  -e HTPASSWD="$HTPASSWD" \
  gmtt-dashboard
```

Or via `docker-compose.yml` — flip `BASIC_AUTH` to `"1"` and either supply
`HTPASSWD` or mount an `htpasswd` file.

If you don't pass `HTPASSWD` but set `BASIC_AUTH=1`, the entrypoint
creates a default `gmtt / Gmtt*2027*ai` user. Override that in prod.

---

## Put it on a real domain

The dashboard is a static site, so any reverse proxy in front of port 80
works. Recommended path:

1. Point a subdomain (e.g. `dash.aiingo.com`) at your host.
2. Reverse-proxy through Caddy / Cloudflare Tunnel / nginx with TLS.
3. **Host on the same parent domain as n8n** (`*.aiingo.com`) so the
   browser → n8n webhook calls don't need CORS workarounds.

### Caddy example

```caddy
dash.aiingo.com {
  reverse_proxy localhost:8080
  encode gzip
}
```

### Cloudflare Tunnel

```sh
cloudflared tunnel --url http://localhost:8080
```

For *real* zero-trust auth, put **Cloudflare Access** in front and drop
the basic_auth layer — Access is more flexible (SSO, MFA, IP allowlists).

---

## Files inside the image

```
/usr/share/nginx/html/
├── login.html                ← landing page (unauthed users)
├── GMTT Dashboard.html       ← main app (auth-guarded by login script)
└── app/                      ← JSX components + styles
```

> `n8n-workflows/` is **not** inside the image. Those JSON files are
> developer reference — you import them into n8n directly from your local
> checkout (or wherever you store this repo). They are not served by the
> dashboard at runtime.

## Updating the in-app password

Edit `login.html`. Replace the two constants:

```js
const EXPECTED_EMAIL = 'new-email@example.com';
const EXPECTED_HASH  = '<sha256 of new password>';
```

Compute the SHA-256 hex with:

```sh
printf 'your-new-password' | shasum -a 256
# or
node -e "crypto.subtle.digest('SHA-256', Buffer.from('your-new-password')).then(b => console.log(Buffer.from(b).toString('hex')))"
```

Rebuild the image to roll the change out.

---

## Wiring to n8n

See `n8n-workflows/README.md` for the eight importable workflows and the
contract for each endpoint. Once n8n is up, paste the production webhook
URLs into the dashboard's **Settings → Integrations → n8n endpoints**
panel. The topbar status pill flips to **Live · n8n** once any GET
endpoint responds.
