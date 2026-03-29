import { processEmails } from './router.js';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minuti

console.log('[CRON] Email processor avviato. Controllo ogni 5 minuti.');

// Esegui subito al avvio
processEmails();

// Poi ogni 5 minuti
setInterval(processEmails, INTERVAL_MS);
