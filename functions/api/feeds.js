const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function normalizeFeed(input) {
  const now = new Date().toISOString();
  const id = String(input.id || crypto.randomUUID());
  const date = String(input.date || "").slice(0, 10);
  const time = String(input.time || "00:00").slice(0, 5);
  const ml = Number.parseInt(input.ml ?? 0, 10) || 0;
  const created_at = String(input.created_at || now);
  const updated_at = String(input.updated_at || now);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data non valida");
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("Ora non valida");
  if (ml < 0 || ml > 1000) throw new Error("Ml non validi");

  return { id, date, time, ml, created_at, updated_at };
}

async function listFeeds(request, env) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) return json({ ok: false, error: "Parametri from/to mancanti" }, 400);

  const result = await env.DB.prepare(
    `SELECT id, date, time, ml, created_at, updated_at
     FROM feeds
     WHERE deleted = 0
       AND date >= ?1
       AND date <= ?2
     ORDER BY date ASC, time ASC`
  ).bind(from, to).all();

  return json({ ok: true, feeds: result.results || [] });
}

async function upsertFeed(env, body) {
  const feed = normalizeFeed(body.feed || {});
  const existing = await env.DB.prepare(
    `SELECT created_at FROM feeds WHERE id = ?1`
  ).bind(feed.id).first();

  const createdAt = existing?.created_at || feed.created_at;

  await env.DB.prepare(
    `INSERT INTO feeds (id, date, time, ml, created_at, updated_at, deleted)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)
     ON CONFLICT(id) DO UPDATE SET
       date = excluded.date,
       time = excluded.time,
       ml = excluded.ml,
       updated_at = excluded.updated_at,
       deleted = 0
     WHERE feeds.updated_at IS NULL OR feeds.updated_at <= excluded.updated_at`
  ).bind(feed.id, feed.date, feed.time, feed.ml, createdAt, feed.updated_at).run();

  return json({ ok: true, feed });
}

async function deleteFeed(env, body) {
  const id = String(body.id || "");
  const updatedAt = String(body.updated_at || new Date().toISOString());

  if (!id) return json({ ok: false, error: "ID mancante" }, 400);

  await env.DB.prepare(
    `UPDATE feeds
     SET deleted = 1, updated_at = ?2
     WHERE id = ?1
       AND (updated_at IS NULL OR updated_at <= ?2)`
  ).bind(id, updatedAt).run();

  return json({ ok: true, id });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (!env.DB) return json({ ok: false, error: "Binding DB mancante" }, 500);

  try {
    if (request.method === "GET") return await listFeeds(request, env);

    if (request.method === "POST") {
      const body = await request.json();
      const action = String(body.action || "");

      if (action === "upsert") return await upsertFeed(env, body);
      if (action === "delete") return await deleteFeed(env, body);

      return json({ ok: false, error: "Azione non valida" }, 400);
    }

    return json({ ok: false, error: "Metodo non consentito" }, 405);
  } catch (error) {
    return json({ ok: false, error: String(error.message || error) }, 500);
  }
}
