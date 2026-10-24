#!/bin/bash
# Brings the server up to date after you push changes to GitHub:   sudo bash /opt/aea/server/update.sh
set -euo pipefail
DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
[ "$(id -u)" = 0 ] || { echo "Please run with sudo: sudo bash $DIR/server/update.sh"; exit 1; }
git -C "$DIR" pull --ff-only
bash "$DIR/server/install.sh"
