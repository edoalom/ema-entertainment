# K-Pop School: The Battle — Agent System

Multi-agent AI backend per la produzione di K-Pop School: The Battle.
13 agenti specializzati su Express + MySQL + Claude API.

## Setup rapido

### 1. Clona e installa

```bash
git clone <repo>
cd kpop-school-agents
```

### 2. Deploy VPS (automatico)

```bash
chmod +x install.sh
./install.sh
```

Lo script installa Node.js 20, PM2, dipendenze npm, crea `.env` interattivo, esegue schema MySQL e avvia con PM2.

### 3. Setup manuale

```bash
cp .env.example .env
# Edita .env con le tue credenziali
npm install
mysql -u root -p < sql/schema.sql
node src/index.js
```

## Configurazione `.env`

| Variabile | Descrizione |
|---|---|
| `ANTHROPIC_API_KEY` | API key Anthropic |
| `DB_HOST` | Host MySQL (default: localhost) |
| `DB_PORT` | Porta MySQL (default: 3306) |
| `DB_USER` | Utente MySQL |
| `DB_PASSWORD` | Password MySQL |
| `DB_NAME` | Nome database (default: kpop_agents) |
| `PORT` | Porta server (default: 3000) |

## API

### Health check
```
GET /health
```

### Lista agenti
```
GET /api/agents
```

### Chiama un agente
```
POST /api/agents/:name
Content-Type: application/json

{
  "message": "Il tuo messaggio",
  "sessionId": "optional-session-id"
}
```

**Agenti disponibili:** `tom`, `sofia`, `marco`, `giulia`, `andrea`, `elena`, `chiara`, `rob`, `max`, `francesca`, `liv`, `val`, `david`

### Esempio
```bash
curl -X POST http://localhost:3000/api/agents/tom \
  -H "Content-Type: application/json" \
  -d '{"message": "Qual è lo stato del progetto?", "sessionId": "test-001"}'
```

## Team agenti

| Agente | Ruolo |
|---|---|
| TOM | Project Manager |
| SOFIA | Story Editor |
| MARCO | Visual Director |
| GIULIA | Comic Producer |
| ANDREA | Music Supervisor |
| ELENA | Character Developer |
| CHIARA | Live Show Producer |
| ROB | Technical Director |
| MAX | Marketing Lead |
| FRANCESCA | Social Media Manager |
| LIV | PR & Communications |
| VAL | Email Marketing & Router |
| DAVID | Community Manager |

## PM2

```bash
pm2 status          # stato processi
pm2 logs            # logs real-time
pm2 restart all     # riavvia
pm2 stop all        # ferma
```
