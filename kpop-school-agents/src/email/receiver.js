import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
dotenv.config();

export async function fetchNewEmails() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    logger: false
  });

  await client.connect();
  const emails = [];

  await client.mailboxOpen('INBOX');

  // Prendi solo email non lette
  for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true })) {
    const raw = msg.source.toString();
    const body = raw.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim();

    emails.push({
      messageId: msg.envelope.messageId,
      from: msg.envelope.from[0]?.address || '',
      to: msg.envelope.to[0]?.address || '',
      subject: msg.envelope.subject || '',
      body: body.substring(0, 2000),
      date: msg.envelope.date
    });

    // Marca come letta
    await client.messageFlagsAdd(msg.seq, ['\\Seen']);
  }

  await client.logout();
  return emails;
}
