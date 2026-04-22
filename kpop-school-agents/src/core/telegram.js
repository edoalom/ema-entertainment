import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(message) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[TELEGRAM] Errore invio:', err);
    }
  } catch (err) {
    console.error('[TELEGRAM] Connessione fallita:', err.message);
  }
}
