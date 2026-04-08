const OPENAI_URL = 'https://api.openai.com/v1/responses';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function toInputItems(system, messages) {
  const items = [];

  if (system) {
    items.push({
      role: 'system',
      content: [{ type: 'input_text', text: system }],
    });
  }

  for (const message of messages || []) {
    if (!message?.content) continue;
    items.push({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'input_text', text: message.content }],
    });
  }

  return items;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'Missing OPENAI_API_KEY environment variable' });
  }

  try {
    const { system = '', messages = [], maxTokens = 800 } = JSON.parse(event.body || '{}');
    const input = toInputItems(system, messages);

    if (input.length === 0) {
      return json(400, { error: 'No AI input provided' });
    }

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input,
        max_output_tokens: maxTokens,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || 'OpenAI request failed' });
    }

    return json(200, { text: data.output_text || '' });
  } catch (error) {
    return json(500, { error: error.message || 'Unexpected AI error' });
  }
}
