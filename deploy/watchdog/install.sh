#!/bin/bash
# Installs the watchdog and the resource limits for the Codex user. Run as root on the VPS.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
UID_K=$(id -u kadiata 2>/dev/null) || { echo "no kadiata user yet: run this again once it exists"; exit 0; }
install -m 755 "$HERE/valet-watchdog.sh" /usr/local/sbin/valet-watchdog
install -m 644 "$HERE/valet-watchdog.service" "$HERE/valet-watchdog.timer" /etc/systemd/system/
install -d "/etc/systemd/system/user-${UID_K}.slice.d"
install -m 644 "$HERE/user-limits.conf" "/etc/systemd/system/user-${UID_K}.slice.d/limits.conf"
systemctl daemon-reload
systemctl enable --now valet-watchdog.timer
echo "watchdog: $(systemctl is-active valet-watchdog.timer); limits: $(systemctl show user-${UID_K}.slice -p CPUQuotaPerSecUSec -p MemoryHigh | tr '\n' ' ')"
