#!/usr/bin/env bash
set -euo pipefail

# Installs FlareSolverr runtime + CyberStrikeAI wrapper on Debian/Ubuntu hosts.
# Run with:
#   sudo bash scripts/install-flaresolverr.sh

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v apt-get >/dev/null 2>&1; then
  echo "apt-get not found. This script currently supports Debian/Ubuntu only." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/4] Installing Docker dependencies..."
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates curl
if ! command -v docker >/dev/null 2>&1; then
  if dpkg -s containerd.io >/dev/null 2>&1; then
    echo "[WARN] containerd.io is installed; skipping docker.io to avoid conflicts"
    echo "[WARN] install Docker engine manually, then re-run this script"
    exit 1
  fi
  apt-get install -y --no-install-recommends docker.io
fi

echo "[2/4] Installing FlareSolverr wrapper..."
install -m 0755 "$ROOT_DIR/scripts/flaresolverr-client.py" /usr/local/bin/flaresolverr-client

echo "[3/4] Pulling and starting FlareSolverr service..."
docker pull ghcr.io/flaresolverr/flaresolverr:latest
if docker ps -a --format '{{.Names}}' | grep -qx 'flaresolverr'; then
  docker rm -f flaresolverr >/dev/null 2>&1 || true
fi
docker run -d \
  --name flaresolverr \
  --restart unless-stopped \
  -p 8191:8191 \
  -e LOG_LEVEL=info \
  ghcr.io/flaresolverr/flaresolverr:latest >/dev/null

echo "[4/4] Verifying service..."
sleep 2
curl -fsS http://127.0.0.1:8191/ >/dev/null && echo "[OK] FlareSolverr HTTP endpoint reachable"
docker ps --filter name=flaresolverr --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo
echo "FlareSolverr install complete."
echo "Tool command available: flaresolverr-client"
