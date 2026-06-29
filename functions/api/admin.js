function text(data, status = 200, contentType = "text/plain; charset=utf-8") {
  return new Response(data, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function csvEscape(value) {
  const textValue = String(value ?? "");
  if (/[",\n;]/.test(textValue)) return `"${textValue.replaceAll('"', '""')}"`;
  return textValue;
}

function isBackendAdmin(request, env) {
  const expected = env.ADMIN_SECRET || "";
  const received = request.headers.get("X-Admin-Secret") || "";
  return expected && received && expected === received;
}

async function exportCsv(env) {
  const result = await env.DB.prepare(
    `SELECT id, date, time, ml, created_at, updated_at
     FROM feeds
     WHERE deleted = 0
     ORDER BY date ASC, time ASC`
  ).all();

  const rows = result.results || [];
  const header = ["id", "date", "time", "ml", "created_at", "updated_at"];

  const csv = [
    header.join(","),
    ...rows.map(row => header.map(key => csvEscape(row[key])).join(","))
  ].join("\n");

  return text(csv, 200, "text/csv; charset=utf-8");
}

async function stats(env) {
  const total = await env.DB.prepare(
    `SELECT COUNT(*) AS count, COALESCE(SUM(ml), 0) AS ml_total
     FROM feeds
     WHERE deleted = 0`
  ).first();

  const latest = await env.DB.prepare(
    `SELECT date, time, ml, updated_at
     FROM feeds
     WHERE deleted = 0
     ORDER BY updated_at DESC
     LIMIT 1`
  ).first();

  const week = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'week_start'`
  ).first();

  return json({
    ok: true,
    count: total?.count || 0,
    ml_total: total?.ml_total || 0,
    latest: latest || null,
    week_start: week?.value || null
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "stats";

  if (!env.DB) return json({ ok: false, error: "Binding DB mancante" }, 500);
  if (!env.ADMIN_SECRET) return json({ ok: false, error: "ADMIN_SECRET mancante" }, 500);

  if (!isBackendAdmin(request, env)) {
    return json({ ok: false, error: "Non autorizzato" }, 401);
  }

  if (action === "stats") return await stats(env);
  if (action === "export") return await exportCsv(env);

  return json({ ok: false, error: "Azione admin non valida" }, 400);
}
