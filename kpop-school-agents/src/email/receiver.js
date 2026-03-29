import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
dotenv.config();

export async function fetchNewEmails() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    logger: false
  });

  const emails = [];
  await client.connect();

  try {
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`[IMAP] Mailbox aperta. Messaggi: ${mailbox.exists}`);

    if (mailbox.exists === 0) {
      console.log('[IMAP] Nessun messaggio.');
      return [];
    }

    for await (const msg of client.fetch('1:5', { envelope: true, bodyParts: ['TEXT'] })) {
      try {
        let body = '';
        if (msg.bodyParts?.get('TEXT')) {
          body = msg.bodyParts.get('TEXT').toString().substring(0, 2000);
        }

        emails.push({
          messageId: msg.envelope.messageId || `msg-${Date.now()}`,
          from: msg.envelope.from?.[0]?.address || '',
          to: msg.envelope.to?.[0]?.address || '',
          subject: msg.envelope.subject || '(nessun oggetto)',
          body
        });

        await client.messageFlagsAdd(msg.seq, ['\\Seen']);
      } catch (msgErr) {
        console.warn('[IMAP] Errore messaggio:', msgErr.message);
      }
    }
  } finally {
    await client.logout();
  }

  console.log(`[IMAP] ${emails.length} email recuperate.`);
  return emails;
}
