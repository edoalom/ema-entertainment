import Pop3Command from 'poplib';
import dotenv from 'dotenv';
dotenv.config();

export async function fetchNewEmails() {
  return new Promise((resolve, reject) => {
    const emails = [];
    const client = new Pop3Command(
      parseInt(process.env.POP3_PORT || 995),
      process.env.POP3_HOST || 'pop3.aruba.it',
      { enabletls: true }
    );

    client.on('error', (err) => {
      console.error('[POP3] Errore connessione:', err.message);
      reject(err);
    });

    client.on('connect', () => {
      console.log('[POP3] Connesso.');
      client.login(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
    });

    client.on('login', (status) => {
      if (!status) {
        reject(new Error('POP3 login fallito'));
        return;
      }
      console.log('[POP3] Login OK.');
      client.list();
    });

    client.on('list', (status, msgcount) => {
      if (!status || msgcount === 0) {
        console.log('[POP3] Nessun messaggio.');
        client.quit();
        resolve([]);
        return;
      }
      console.log(`[POP3] ${msgcount} messaggi trovati.`);
      // Prendi solo gli ultimi 10
      const start = Math.max(1, msgcount - 9);
      for (let i = start; i <= msgcount; i++) {
        client.retr(i);
      }
    });

    let pending = 0;
    client.on('retr', (status, msgnumber, data) => {
      if (status && data) {
        const raw = data.toString();
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
          messageId: messageId || `msg-${Date.now()}-${msgnumber}`,
          from, to, subject, body
        });

        // Cancella dal server dopo lettura
        client.dele(msgnumber);
      }
      pending--;
      if (pending <= 0) client.quit();
    });

    client.on('quit', () => {
      console.log(`[POP3] Disconnesso. ${emails.length} email recuperate.`);
      resolve(emails);
    });

    // Traccia messaggi pendenti
    const origRetr = client.retr.bind(client);
    client.retr = (n) => { pending++; origRetr(n); };
  });
}
