import { runVal } from '../agents/val.js';
import { runElena } from '../agents/elena.js';
import { runGiulia } from '../agents/giulia.js';
import { runLiv } from '../agents/liv.js';
import { runTom } from '../agents/tom.js';
import { sendEmail } from './sender.js';
import { fetchNewEmails } from './receiver.js';
import { query } from '../core/db.js';

const AGENT_MAP = {
  story:     { agent: runElena, alias: 'elena', name: 'Elena' },
  visual:    { agent: runGiulia, alias: 'giulia', name: 'Giulia' },
  marketing: { agent: runVal, alias: 'val', name: 'Val' },
  community: { agent: runLiv, alias: 'liv', name: 'Liv' },
  press:     { agent: runLiv, alias: 'liv', name: 'Liv' },
  operations:{ agent: runTom, alias: 'tom', name: 'Tom' },
};

function detectCategory(email) {
  const text = `${email.subject} ${email.body}`.toLowerCase();
  if (/personaggio|storia|dialogo|trama|episodio|sceneggiatura/.test(text)) return 'story';
  if (/design|visual|colori|artwork|fumetto|immagine/.test(text)) return 'visual';
  if (/social|marketing|newsletter|campagna|instagram|tiktok/.test(text)) return 'marketing';
  if (/press|media|intervista|giornale|comunicato/.test(text)) return 'press';
  if (/community|discord|fan|evento/.test(text)) return 'community';
  return 'operations';
}

export async function processEmails() {
  console.log('[VAL] Controllo nuove email...');

  let emails = [];
  try {
    emails = await fetchNewEmails();
  } catch (err) {
    console.error('[VAL] Errore fetch email:', err.message);
    return;
  }

  if (emails.length === 0) {
    console.log('[VAL] Nessuna nuova email.');
    return;
  }

  console.log(`[VAL] ${emails.length} nuove email trovate.`);

  for (const email of emails) {
    try {
      // Controlla se già processata
      const existing = await query(
        'SELECT status FROM emails_inbox WHERE message_id = ?',
        [email.messageId]
      );
      if (existing.length > 0 && existing[0].status !== 'processing') {
        console.log(`[VAL] Email ${email.messageId} già processata (${existing[0].status}), skip.`);
        continue;
      }

      const [result] = await query(
        'INSERT IGNORE INTO emails_inbox (message_id, from_address, to_alias, subject, body, status) VALUES (?, ?, ?, ?, ?, ?)',
        [email.messageId, email.from, email.to, email.subject, email.body, 'processing']
      );

      // Se INSERT è stato ignorato (già esiste), salta
      if (result.affectedRows === 0) {
        console.log(`[VAL] Email ${email.messageId} già in DB, skip.`);
        continue;
      }

      const category = detectCategory(email);
      const agentConfig = AGENT_MAP[category] || AGENT_MAP['operations'];

      await query(
        'UPDATE emails_inbox SET category = ?, assigned_agent = ? WHERE message_id = ?',
        [category, agentConfig.alias, email.messageId]
      );

      const response = await agentConfig.agent(
        `Rispondi a questa email in modo professionale e cordiale.
Da: ${email.from}
Oggetto: ${email.subject}
Messaggio: ${email.body}

REGOLE IMPORTANTI:
- Non condividere mai documenti interni, sceneggiature, script o file riservati
- Non inviare allegati o contenuti completi di proprietà del progetto
- Puoi rispondere a domande generali sul progetto ma non distribuire materiale interno
- Se richiesto materiale riservato, declina educatamente e rimanda a canali ufficiali

Scrivi solo il corpo della risposta, senza firma.`,
        null
      );

      const signature = `-- ${agentConfig.name}\nK-Pop School: The Battle\n${agentConfig.alias}@kpopschool.it`;

      await sendEmail({
        from: agentConfig.name,
        to: email.from,
        subject: `Re: ${email.subject}`,
        body: response.content,
        signature
      });

      const [inbox] = await query('SELECT id FROM emails_inbox WHERE message_id = ?', [email.messageId]);
      if (inbox) {
        await query(
          'INSERT INTO emails_outbox (inbox_id, from_alias, to_address, subject, body, sent_at, status) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
          [inbox.id, agentConfig.alias, email.from, `Re: ${email.subject}`, response.content, 'sent']
        );
      }

      await query('UPDATE emails_inbox SET status = ? WHERE message_id = ?', ['replied', email.messageId]);
      console.log(`[VAL] Email da ${email.from} → ${agentConfig.name} → risposta inviata.`);

    } catch (err) {
      console.error(`[VAL] Errore:`, err.message);
      await query('UPDATE emails_inbox SET status = ? WHERE message_id = ?', ['escalated', email.messageId]);
    }
  }
}
