#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

DOMAIN="agents.productionpro.it"
EMAIL="edo@productionpro.it"   # <-- cambia con la tua email per Let's Encrypt
UPSTREAM="http://localhost:3000"

echo "================================================"
echo "  K-Pop School Agents — NGINX + SSL Setup"
echo "  Dominio: $DOMAIN"
echo "================================================"
echo ""

# 1. Installa nginx e certbot
echo "--- [1/5] Installazione nginx e certbot ---"
apt-get update -q
apt-get install -y nginx certbot python3-certbot-nginx
ok "nginx e certbot installati"

# 2. Configura nginx (HTTP, senza SSL — certbot aggiungerà HTTPS)
echo ""
echo "--- [2/5] Configurazione nginx ---"
cat > /etc/nginx/sites-available/kpop-agents << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Health check nginx
    location /nginx-health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    # Reverse proxy → Node.js :3000
    location / {
        proxy_pass ${UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
    }
}
NGINXEOF

# Abilita il sito
ln -sf /etc/nginx/sites-available/kpop-agents /etc/nginx/sites-enabled/kpop-agents
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t || err "Configurazione nginx non valida"
systemctl reload nginx
ok "nginx configurato e riavviato"

# 3. Verifica DNS prima di procedere con certbot
echo ""
echo "--- [3/5] Verifica DNS ---"
RESOLVED_IP=$(dig +short "$DOMAIN" | tail -1)
EXPECTED_IP="188.213.161.123"

if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
  ok "DNS risolve correttamente: $DOMAIN → $RESOLVED_IP"
else
  warn "DNS non ancora propagato o errato."
  warn "Attuale: '$RESOLVED_IP' | Atteso: '$EXPECTED_IP'"
  warn "Aggiungi il record A su Aruba e riprova tra qualche minuto."
  echo ""
  read -p "Vuoi procedere comunque con certbot? (s/N): " PROCEED
  [[ "$PROCEED" =~ ^[Ss]$ ]] || { warn "Certbot saltato. Riesegui lo script dopo la propagazione DNS."; exit 0; }
fi

# 4. Ottieni certificato SSL
echo ""
echo "--- [4/5] Certificato SSL Let's Encrypt ---"
certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect
ok "Certificato SSL ottenuto e HTTPS configurato"

# 5. Rinnovo automatico
echo ""
echo "--- [5/5] Rinnovo automatico ---"
systemctl enable certbot.timer 2>/dev/null || true
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | sort -u | crontab -
ok "Rinnovo automatico configurato"

# Verifica finale
echo ""
nginx -t && systemctl reload nginx
ok "nginx riavviato con configurazione finale"

echo ""
echo "================================================"
echo -e "${GREEN}  ✅ Setup completato!${NC}"
echo "================================================"
echo ""
echo "  HTTPS: https://${DOMAIN}/health"
echo "  API:   https://${DOMAIN}/api/agents"
echo ""
echo "  Test rapido:"
echo "  curl https://${DOMAIN}/health"
echo ""
