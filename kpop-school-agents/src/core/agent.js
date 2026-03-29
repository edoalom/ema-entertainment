import Anthropic from '@anthropic-ai/sdk';
import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runAgent(agentName, systemPrompt, userMessage, sessionId = null) {
  const history = [];

  // Carica storico conversazione se sessionId presente
  if (sessionId) {
    const rows = await query(
      'SELECT role, content FROM conversations WHERE session_id = ? AND agent_name = ? ORDER BY created_at ASC LIMIT 20',
      [sessionId, agentName]
    );
    rows.forEach(r => history.push({ role: r.role, content: r.content }));
  }

  const messages = [...history, { role: 'user', content: userMessage }];
  const startTime = Date.now();
  let success = true;
  let errorMessage = null;
  let result = null;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages
    });

    result = response.content[0].text;

    // Salva conversazione
    if (sessionId) {
      await query(
        'INSERT INTO conversations (session_id, agent_name, role, content) VALUES (?, ?, ?, ?)',
        [sessionId, agentName, 'user', userMessage]
      );
      await query(
        'INSERT INTO conversations (session_id, agent_name, role, content) VALUES (?, ?, ?, ?)',
        [sessionId, agentName, 'assistant', result]
      );
    }

    // Log API
    await query(
      'INSERT INTO api_logs (agent_name, input_tokens, output_tokens, duration_ms, success) VALUES (?, ?, ?, ?, ?)',
      [agentName, response.usage.input_tokens, response.usage.output_tokens, Date.now() - startTime, true]
    );

  } catch (err) {
    success = false;
    errorMessage = err.message;
    await query(
      'INSERT INTO api_logs (agent_name, duration_ms, success, error_message) VALUES (?, ?, ?, ?)',
      [agentName, Date.now() - startTime, false, errorMessage]
    );
    throw err;
  }

  return { agent: agentName, content: result, sessionId };
}
