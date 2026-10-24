#!/bin/bash
# Sets up the login server on a fresh Ubuntu server. Run once, from the copy of the site on the server:
#   sudo bash /opt/aea/server/install.sh
# Safe to run again: it only adds what is missing and restarts the program.
set -euo pipefail
DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
[ "$(id -u)" = 0 ] || { echo "Please run with sudo: sudo bash $DIR/server/install.sh"; exit 1; }

node_ok() { command -v node >/dev/null && node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)'; }
echo "== 1. Node.js"
if ! node_ok; then apt-get update -q && apt-get install -y -q nodejs || true; fi
if ! node_ok; then
  echo "Ubuntu's Node.js is too old or missing: installing Node.js 24 from NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y -q nodejs
fi
node_ok || { echo "Node.js 22.13 or newer is needed and could not be installed."; exit 1; }
echo "Node.js $(node --version)"

echo "== 2. A user and a data folder for the program"
id aea >/dev/null 2>&1 || useradd --system --home-dir /var/lib/aea --shell /usr/sbin/nologin aea
mkdir -p /var/lib/aea
chown aea:aea /var/lib/aea
chmod 700 /var/lib/aea

echo "== 3. The program as a service"
sed "s#__DIR__#$DIR#g" "$DIR/server/aea-api.service" > /etc/systemd/system/aea-api.service
cat > /usr/local/bin/aea-admin <<ADMIN
#!/bin/sh
# Teacher accounts: aea-admin add-teacher <username> "<Display name>" | teacher-password <username> | list
exec sudo -u aea node --disable-warning=ExperimentalWarning "$DIR/server/admin.js" "\$@"
ADMIN
chmod 755 /usr/local/bin/aea-admin
systemctl daemon-reload
systemctl enable aea-api >/dev/null 2>&1
systemctl restart aea-api

echo "== 4. Caddy (HTTPS)"
if command -v caddy >/dev/null; then
  cp "$DIR/server/Caddyfile" /etc/caddy/Caddyfile
  systemctl reload caddy || systemctl restart caddy
else
  echo "Caddy is not installed: sudo apt install -y caddy, then run this again."
fi

echo "== 5. Check"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "The login program is running."
    echo "Next: make your teacher login with   sudo aea-admin add-teacher <username> \"<Your name>\""
    exit 0
  fi
  sleep 1
done
echo "The program did not start. Show what went wrong with:   sudo journalctl -u aea-api -n 30 --no-pager"
exit 1
