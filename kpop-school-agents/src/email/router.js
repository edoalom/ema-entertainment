import { runVal } from '../agents/val.js';
import { runElena } from '../agents/elena.js';
import { runGiulia } from '../agents/giulia.js';
import { runLiv } from '../agents/liv.js';
import { runTom } from '../agents/tom.js';
import { sendEmail } from './sender.js';
import { fetchNewEmails } from './receiver.js';
import { query } from '../core/db.js';

const AGENT_MAP = {
  character_question: { agent: runElena, alias: 'elena', name: 'Elena' },
  story_question:     { agent: runElena, alias: 'elena', name: 'Elena' },
  visual_question:    { agent: runGiulia, alias: 'giulia', name: 'Giulia' },
  music_question:     { agent: runTom, alias: 'tom', name: 'Tom' },
  marketing_question: { agent: runVal, alias: 'val', name: 'Val' },
  technical_question: { agent: runTom, alias: 'tom', name: 'Tom' },
  community_question: { agent: runLiv, alias: 'liv', name: 'Liv' },
  press_inquiry:      { agent: runLiv, alias: 'liv', name: 'Liv' },
  project_management: { agent: runTom, alias: 'tom', name: 'Tom' },
};

export async function processEmails() {
  console.log('[VAL] Controllo nuove email...');

  let emails = [];
  try {
    emails = await fetchNewEmails();
  } catch (err) {
    console.error('[VAL] Errore POP3:', err.message);
    return;
  }

  if (emails.length === 0) {
    console.log('[VAL] Nessuna nuova email.');
    return;
  }

  console.log(`[VAL] ${emails.length} nuove email trovate.`);

  for (const email of emails) {
    try {
      // Salva in inbox
      await query(
        'INSERT IGNORE INTO emails_inbox (message_id, from_address, to_alias, subject, body, status) VALUES (?, ?, ?, ?, ?, ?)',
        [email.messageId, email.from, email.to, email.subject, email.body, 'processing']
      );

      // VAL categorizza
      const categorization = await runVal(
        `Categorizza questa email e rispondi SOLO con la categoria in formato JSON.
Email da: ${email.from}
Oggetto: ${email.subject}
Corpo: ${email.body}

Rispondi SOLO con: {"category": "character_question|story_question|visual_question|music_question|marketing_question|technical_question|community_question|press_inquiry|project_management|escalation"}`,
        null
      );

      let category = 'project_management';
      try {
        const parsed = JSON.parse(categorization.content.trim());
        category = parsed.category || 'project_management';
      } catch {
        console.warn('[VAL] Categorizzazione fallita, uso default.');
      }

      // Aggiorna categoria
      await query(
        'UPDATE emails_inbox SET category = ?, assigned_agent = ? WHERE message_id = ?',
        [category, AGENT_MAP[category]?.alias || 'tom', email.messageId]
      );

      // Escalation a Edo
      if (category === 'escalation') {
        console.log(`[VAL] ESCALATION richiesta per email da ${email.from}`);
        await query('UPDATE emails_inbox SET status = ? WHERE message_id = ?', ['escalated', email.messageId]);
        continue;
      }

      // Genera risposta con agente corretto
      const agentConfig = AGENT_MAP[category] || AGENT_MAP['project_management'];
      const response = await agentConfig.agent(
        `Rispondi a questa email in modo professionale e cordiale.
Da: ${email.from}
Oggetto: ${email.subject}
Messaggio: ${email.body}

Scrivi solo il corpo della risposta, senza firma.`,
        null
      );

      // Firma agente
      const signature = `-- ${agentConfig.name}\nK-Pop School: The Battle Team\ninfo@kpopschool.it`;

      // Invia risposta
      await sendEmail({
        from: agentConfig.name,
        to: email.from,
        cc: process.env.EMAIL_USER,
        subject: `Re: ${email.subject}`,
        body: response.content,
        signature
      });

      // Salva outbox
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
      console.error(`[VAL] Errore processing email ${email.messageId}:`, err.message);
      await query('UPDATE emails_inbox SET status = ? WHERE message_id = ?', ['escalated', email.messageId]);
    }
  }
}
