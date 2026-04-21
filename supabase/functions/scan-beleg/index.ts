// @ts-nocheck — Supabase Edge Function (Deno runtime)
// Deployed to Supabase. Requires secret OPENAI_API_KEY.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY not set in Supabase secrets' }, 500);
  }

  try {
    const { image_base64 } = await req.json();
    if (!image_base64 || typeof image_base64 !== 'string') {
      return json({ error: 'image_base64 required' }, 400);
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Du analysierst deutsche Kassenbons. Extrahiere den Gesamtbetrag (Summe/Gesamt/Total) in Euro und den Händlernamen. Antworte NUR mit JSON, ohne Erklärung, ohne Markdown-Fences: {"betrag": <zahl mit punkt als dezimaltrenner>, "haendler": <string oder null>}. Der Betrag ist IMMER der Endbetrag des Bons, nicht Einzelposten.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahiere Gesamtbetrag und Händler vom Bon.' },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${image_base64}` },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return json({ error: `OpenAI ${openaiRes.status}: ${errText.slice(0, 200)}` }, 502);
    }

    const data = await openaiRes.json();
    const content: string = data.choices?.[0]?.message?.content ?? '{}';
    const cleaned = content.replace(/```json\s*|```\s*/g, '').trim();

    let parsed: { betrag?: number; haendler?: string | null };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return json({ error: `Antwort nicht parsbar: ${cleaned.slice(0, 120)}` }, 502);
    }

    const betrag = typeof parsed.betrag === 'number' ? parsed.betrag : parseFloat(String(parsed.betrag));
    if (!betrag || isNaN(betrag) || betrag <= 0) {
      return json({ error: 'Kein Betrag erkannt' }, 422);
    }

    return json({ betrag, haendler: parsed.haendler ?? null });
  } catch (e) {
    return json({ error: e?.message ?? 'Unbekannter Fehler' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
