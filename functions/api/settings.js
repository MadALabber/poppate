const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export async function onRequest(context) {
  const { request, env } = context;

  if (!env.DB) return json({ ok: false, error: "Binding DB mancante" }, 500);

  try {
    if (request.method === "GET") {
      const row = await env.DB.prepare(
        `SELECT value FROM settings WHERE key = 'week_start'`
      ).first();

      return json({ ok: true, week_start: row?.value || null });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const key = String(body.key || "");
      const value = String(body.value || "");

      if (key !== "week_start") return json({ ok: false, error: "Setting non valida" }, 400);
      if (!validDate(value)) return json({ ok: false, error: "Data non valida" }, 400);

      await env.DB.prepare(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`
      ).bind(key, value, new Date().toISOString()).run();

      return json({ ok: true, week_start: value });
    }

    return json({ ok: false, error: "Metodo non consentito" }, 405);
  } catch (error) {
    return json({ ok: false, error: String(error.message || error) }, 500);
  }
}
