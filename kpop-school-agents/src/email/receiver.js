import Pop3 from 'node-pop3';
import dotenv from 'dotenv';
dotenv.config();

export async function fetchNewEmails() {
  const pop3 = new Pop3({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.POP3_HOST || 'pop3.aruba.it',
    port: parseInt(process.env.POP3_PORT || 995),
    tls: true,
    timeout: 10000
  });

  const emails = [];

  try {
    await pop3.connect();
    console.log('[POP3] Connesso e autenticato.');

    const list = await pop3.UIDL();
    console.log(`[POP3] ${list.length} messaggi trovati.`);

    if (list.length === 0) {
      await pop3.QUIT();
      return [];
    }

    // Prendi solo ultimi 10
    const recent = list.slice(-10);

    for (const [msgnum] of recent) {
      try {
        const raw = await pop3.RETR(msgnum);
        const lines = raw.split('\r\n');

        let from = '', to = '', subject = '', messageId = '';
        let bodyStart = 0;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('From:')) from = lines[i].replace('From:', '').trim();
          if (lines[i].startsWith('To:')) to = lines[i].replace('To:', '').trim();
          if (lines[i].startsWith('Subject:')) subject = lines[i].replace('Subject:', '').trim();
          if (lines[i].startsWith('Message-ID:')) messageId = lines[i].replace('Message-ID:', '').trim();
          if (lines[i] === '') { bodyStart = i + 1; break; }
        }

        const body = lines.slice(bodyStart).join('\n').trim().substring(0, 2000);

        emails.push({
          messageId: messageId || `msg-${Date.now()}-${msgnum}`,
          from, to, subject, body
        });

        // Cancella dal server
        await pop3.DELE(msgnum);
      } catch (err) {
        console.warn(`[POP3] Errore messaggio ${msgnum}:`, err.message);
      }
    }

    await pop3.QUIT();
    console.log(`[POP3] ${emails.length} email recuperate.`);

  } catch (err) {
    console.error('[POP3] Errore:', err.message);
    throw err;
  }

  return emails;
}
