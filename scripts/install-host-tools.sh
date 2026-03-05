#!/usr/bin/env bash
set -euo pipefail

# Host-wide installer for common CyberStrikeAI tools on Debian/Ubuntu hosts.
# Run with:
#   sudo bash scripts/install-host-tools.sh

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "apt-get not found on this host. This script currently supports Debian/Ubuntu apt-based systems only." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/4] Updating apt indexes..."
apt-get update -y

echo "[2/4] Installing base dependencies..."
apt-get install -y --no-install-recommends \
  ca-certificates curl wget git unzip xz-utils \
  python3 python3-pip golang-go

echo "[3/4] Installing security tools from apt..."
# The list includes the user-requested tools and additional commonly used
# commands referenced by CyberStrikeAI's built-in tool definitions.
APT_TOOLS=(
  nmap
  sqlmap
  gobuster
  feroxbuster
  ffuf
  nikto
  dirb
  dnsenum
  hydra
  john
  hashcat
  masscan
  wfuzz
  wafw00f
  exiftool
  binwalk
  steghide
  fcrackzip
  pdfcrack
  foremost
  arp-scan
  nbtscan
  smbmap
  rpcclient
  xxd
  strings
  objdump
  gdb
)

AVAILABLE=()
MISSING=()
for pkg in "${APT_TOOLS[@]}"; do
  if apt-cache show "$pkg" >/dev/null 2>&1; then
    AVAILABLE+=("$pkg")
  else
    MISSING+=("$pkg")
  fi
done

if ((${#AVAILABLE[@]} > 0)); then
  apt-get install -y --no-install-recommends "${AVAILABLE[@]}"
fi

if ((${#MISSING[@]} > 0)); then
  echo "Skipped unavailable apt packages: ${MISSING[*]}"
fi

echo "[4/4] Installing Go-based tools commonly used by CyberStrikeAI..."
export GOPATH=/root/go
export GOBIN=/usr/local/bin
mkdir -p "$GOBIN"

go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/katana/cmd/katana@latest
go install github.com/lc/gau/v2/cmd/gau@latest
go install github.com/tomnomnom/waybackurls@latest
go install github.com/projectdiscovery/naabu/v2/cmd/naabu@latest
go install github.com/projectdiscovery/notify/cmd/notify@latest

echo
echo "Installation complete. Quick verification:"
for t in nmap sqlmap nuclei httpx gobuster feroxbuster ffuf subfinder katana gau waybackurls naabu; do
  if command -v "$t" >/dev/null 2>&1; then
    printf "  [OK] %s -> %s\n" "$t" "$(command -v "$t")"
  else
    printf "  [MISS] %s\n" "$t"
  fi
done
