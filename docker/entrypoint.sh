#!/bin/sh
# Generates /etc/nginx/conf.d/gmtt-auth.inc based on env vars before nginx starts.
# Set BASIC_AUTH=1 to require nginx-level credentials in addition to the
# in-app login page. This is the REAL gate — the JS login is UI only.
#
# Provide credentials in one of two ways:
#   1. HTPASSWD env  — a single htpasswd line (e.g. "gmtt:$apr1$...$...")
#   2. Mount a file at /etc/nginx/htpasswd

set -e

INC=/etc/nginx/conf.d/gmtt-auth.inc

if [ "$BASIC_AUTH" = "1" ]; then
  if [ -n "$HTPASSWD" ]; then
    echo "$HTPASSWD" > /etc/nginx/htpasswd
  elif [ ! -f /etc/nginx/htpasswd ]; then
    # Fallback default: gmtt / Gmtt*2027*ai (bcrypt). Replace in production.
    htpasswd -bcB /etc/nginx/htpasswd gmtt 'Gmtt*2027*ai'
    echo "[entrypoint] BASIC_AUTH=1 but no HTPASSWD given — created default gmtt user. Override in prod."
  fi
  chmod 644 /etc/nginx/htpasswd

  cat >"$INC" <<'EOF'
auth_basic "GMTT — restricted";
auth_basic_user_file /etc/nginx/htpasswd;
EOF
  echo "[entrypoint] nginx basic_auth ENABLED."
else
  : >"$INC"   # empty include — no auth at the nginx layer
  echo "[entrypoint] nginx basic_auth disabled (set BASIC_AUTH=1 to enable)."
fi
