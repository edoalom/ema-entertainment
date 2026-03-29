import express from 'express';
import { runTom } from '../agents/tom.js';
import { runElena } from '../agents/elena.js';
import { runGiulia } from '../agents/giulia.js';
import { runLiv } from '../agents/liv.js';
import { runVal } from '../agents/val.js';

const router = express.Router();

const agents = {
  tom: runTom,
  elena: runElena,
  giulia: runGiulia,
  liv: runLiv,
  val: runVal
};

// POST /api/agents/:name
router.post('/:name', async (req, res) => {
  const { name } = req.params;
  const { message, sessionId } = req.body;

  if (!agents[name]) {
    return res.status(404).json({ error: `Agente '${name}' non trovato` });
  }
  if (!message) {
    return res.status(400).json({ error: 'Campo message obbligatorio' });
  }

  try {
    const result = await agents[name](message, sessionId || null);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[${name.toUpperCase()}] Errore:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agents
router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'val',    role: 'Marketing & Communications Manager' },
      { id: 'liv',    role: 'PR & Community Manager' },
      { id: 'elena',  role: 'Story Editor & Character Developer' },
      { id: 'giulia', role: 'Visual Director & Comic Producer' },
      { id: 'tom',    role: 'Project Manager & Operations' }
    ],
    total: 5
  });
});

export default router;
