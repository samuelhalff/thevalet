#!/usr/bin/env bash
# One-time (idempotent) setup of the thevalet.ch VPS (Ubuntu). Run as a sudo user:
#   sudo bash setup-vps.sh "<deploy public key>"
# - nginx serving /var/www/thevalet with the rules of deploy/nginx-thevalet.conf
# - user `deploy`: owns the web root; its key can only rsync into it (rrsync, restrict). rrsync
#   rebases paths, so the GitHub secret DEPLOY_PATH is "." (the web root), not an absolute path.
# - firewall (SSH + HTTP/S), 2 GB swap, automatic security updates
set -euo pipefail
DEPLOY_KEY="${1:?deploy public key required}"
HERE="$(cd "$(dirname "$0")" && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -yq nginx certbot python3-certbot-nginx ufw unattended-upgrades rsync

if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -o deploy -g www-data -m 755 /var/www/thevalet
install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
echo "command=\"/usr/bin/rrsync /var/www/thevalet\",restrict ${DEPLOY_KEY}" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

install -m 644 "$HERE/nginx-thevalet-headers.conf" /etc/nginx/snippets/thevalet-headers.conf
install -m 644 "$HERE/nginx-thevalet.conf" /etc/nginx/sites-available/thevalet
ln -sf /etc/nginx/sites-available/thevalet /etc/nginx/sites-enabled/thevalet
rm -f /etc/nginx/sites-enabled/default
[ -f /var/www/thevalet/index.html ] || echo '<!doctype html><title>The Valet</title>' > /var/www/thevalet/index.html
nginx -t && systemctl reload nginx

ufw allow OpenSSH >/dev/null && ufw allow 'Nginx Full' >/dev/null && ufw --force enable >/dev/null
echo "done: $(nginx -v 2>&1), ufw $(ufw status | head -1)"
