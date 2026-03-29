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

  const lock = await client.getMailboxLock('INBOX');
  try {
    const mailbox = client.mailbox;
    console.log(`[IMAP] Mailbox aperta. Messaggi: ${mailbox.exists}`);

    if (mailbox.exists === 0) {
      console.log('[IMAP] Nessun messaggio.');
      return [];
    }

    const range = `${Math.max(1, mailbox.exists - 4)}:*`;

    for await (const msg of client.fetch(range, { envelope: true, source: true })) {
      try {
        const raw = msg.source.toString();
        const lines = raw.split('\n');

        let subject = '', from = '', to = '';
        let bodyStart = 0;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('Subject:')) subject = lines[i].replace('Subject:', '').trim();
          if (lines[i].startsWith('From:')) from = lines[i].replace('From:', '').trim();
          if (lines[i].startsWith('To:')) to = lines[i].replace('To:', '').trim();
          if (lines[i].trim() === '') { bodyStart = i + 1; break; }
        }

        const body = lines.slice(bodyStart).join('\n').trim().substring(0, 2000);

        emails.push({
          messageId: msg.envelope.messageId || `msg-${Date.now()}-${msg.seq}`,
          from: msg.envelope.from?.[0]?.address || from,
          to: msg.envelope.to?.[0]?.address || to,
          subject: msg.envelope.subject || subject,
          body
        });

        await client.messageFlagsAdd(msg.seq, ['\\Seen']);
        console.log(`[IMAP] Email letta: ${msg.envelope.subject}`);

      } catch (msgErr) {
        console.warn('[IMAP] Errore messaggio:', msgErr.message);
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  console.log(`[IMAP] ${emails.length} email recuperate.`);
  return emails;
}
