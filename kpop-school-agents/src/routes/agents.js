import express from 'express';
import { runTom } from '../agents/tom.js';
import { runSofia } from '../agents/sofia.js';
import { runMarco } from '../agents/marco.js';
import { runGiulia } from '../agents/giulia.js';
import { runAndrea } from '../agents/andrea.js';
import { runElena } from '../agents/elena.js';
import { runChiara } from '../agents/chiara.js';
import { runRob } from '../agents/rob.js';
import { runMax } from '../agents/max.js';
import { runFrancesca } from '../agents/francesca.js';
import { runLiv } from '../agents/liv.js';
import { runVal } from '../agents/val.js';
import { runDavid } from '../agents/david.js';

const router = express.Router();

const agents = {
  tom: runTom, sofia: runSofia, marco: runMarco, giulia: runGiulia,
  andrea: runAndrea, elena: runElena, chiara: runChiara, rob: runRob,
  max: runMax, francesca: runFrancesca, liv: runLiv, val: runVal, david: runDavid
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

// GET /api/agents — lista agenti disponibili
router.get('/', (req, res) => {
  res.json({
    agents: Object.keys(agents),
    total: Object.keys(agents).length
  });
});

export default router;
