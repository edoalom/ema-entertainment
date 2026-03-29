#!/bin/bash

set -e

echo "================================================"
echo "  K-Pop School: The Battle - Agent System"
echo "  Installazione automatica VPS"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 1. NODE.JS
echo "--- [1/6] Controllo Node.js ---"
if command -v node &> /dev/null; then
  NODE_VER=$(node -v)
  ok "Node.js già installato: $NODE_VER"
else
  warn "Node.js non trovato. Installo Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ok "Node.js installato: $(node -v)"
fi

# 2. PM2
echo ""
echo "--- [2/6] Controllo PM2 ---"
if command -v pm2 &> /dev/null; then
  ok "PM2 già installato"
else
  warn "Installo PM2..."
  sudo npm install -g pm2
  ok "PM2 installato"
fi

# 3. NPM INSTALL
echo ""
echo "--- [3/6] Installazione dipendenze ---"
npm install
ok "Dipendenze installate"

# 4. CONFIGURAZIONE .ENV
echo ""
echo "--- [4/6] Configurazione ambiente ---"
if [ -f .env ]; then
  warn ".env già esistente. Salto configurazione."
else
  echo "Inserisci i dati di configurazione:"
  echo ""

  read -p "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
  read -p "DB_HOST [localhost]: " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  read -p "DB_PORT [3306]: " DB_PORT
  DB_PORT=${DB_PORT:-3306}
  read -p "DB_USER: " DB_USER
  read -s -p "DB_PASSWORD: " DB_PASSWORD
  echo ""
  read -p "DB_NAME [kpop_agents]: " DB_NAME
  DB_NAME=${DB_NAME:-kpop_agents}
  read -p "PORT [3000]: " PORT
  PORT=${PORT:-3000}

  cat > .env << ENVEOF
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
PORT=${PORT}
ENVEOF

  ok ".env creato"
fi

# 5. DATABASE
echo ""
echo "--- [5/6] Setup database MySQL ---"
source .env
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" < sql/schema.sql 2>/dev/null; then
  ok "Database e tabelle creati"
else
  err "Errore connessione MySQL. Controlla credenziali in .env"
fi

# 6. PM2 START
echo ""
echo "--- [6/6] Avvio con PM2 ---"
pm2 delete kpop-school-agents 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash 2>/dev/null || warn "Configura manualmente pm2 startup"
ok "Applicazione avviata con PM2"

# RIEPILOGO
echo ""
echo "================================================"
echo -e "${GREEN}  ✅ Installazione completata!${NC}"
echo "================================================"
echo ""
echo "  Health check: http://localhost:${PORT}/health"
echo "  Agenti API:   http://localhost:${PORT}/api/agents"
echo ""
echo "  Comandi utili:"
echo "  pm2 status          → stato processi"
echo "  pm2 logs            → logs real-time"
echo "  pm2 restart all     → riavvia"
echo ""
