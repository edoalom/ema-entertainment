import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './core/db.js';
import agentsRouter from './routes/agents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'K-Pop School: The Battle', agents: 13 });
});

// Routes
app.use('/api/agents', agentsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trovata' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Errore interno server' });
});

// Start
async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('❌ Impossibile connettersi al database. Controlla .env');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`🚀 K-Pop School Agents running on port ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/health`);
    console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`);
  });
}

start();
