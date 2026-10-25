import { getStore } from "@netlify/blobs";
import { loadCritiques } from "../lib/analyse.mjs";

export const config = { path: "/api/*" };

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const isAdmin = (req) => {
  const p = process.env.ADMIN_PASSWORD;
  return !!p && req.headers.get("x-admin-key") === p;
};
const clip = (s, n) => String(s ?? "").trim().slice(0, n);

export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const meta = getStore("meta");
  try {
    if (route === "config" && req.method === "GET") {
      const c = await meta.get("config", { type: "json" });
      return json({ names: c?.names || null });
    }

    if (route === "critique" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const g = clip(b.g, 80), text = clip(b.text, 5000), ig = Number(b.ig);
      if (!g || !text || ![0, 1, 2].includes(ig)) return json({ error: "Group name, text and infographic are required" }, 400);
      const key = Date.now() + "-" + crypto.randomUUID().slice(0, 8);
      await getStore("critiques").setJSON(key, { g, ig, text, ts: Date.now() });
      return json({ ok: true });
    }

    if (route.startsWith("admin/")) {
      if (!isAdmin(req)) return json({ error: "Unauthorised" }, 401);

      if (route === "admin/critiques" && req.method === "GET") return json({ critiques: await loadCritiques() });

      if (route === "admin/config" && req.method === "PUT") {
        const b = await req.json().catch(() => ({}));
        const names = [0, 1, 2].map((i) => clip(b.names?.[i], 80) || "Infographic " + (i + 1));
        await meta.setJSON("config", { names });
        return json({ ok: true });
      }

      if (route === "admin/analysis" && req.method === "GET") {
        const [analysis, job] = await Promise.all([meta.get("analysis", { type: "json" }), meta.get("job", { type: "json" })]);
        return json({ analysis: analysis || null, job: job || null });
      }

      if (route === "admin/analysis" && req.method === "PUT") {
        const b = await req.json().catch(() => ({}));
        if (!Array.isArray(b.analysis?.axes)) return json({ error: "Invalid analysis" }, 400);
        await meta.setJSON("analysis", b.analysis);
        return json({ ok: true });
      }

      if (route === "admin/analyse" && req.method === "POST") {
        const job = await meta.get("job", { type: "json" });
        if (job?.state === "running" && Date.now() - job.ts < 12 * 60 * 1000) return json({ error: "Already running" }, 409);
        await meta.setJSON("job", { state: "running", ts: Date.now() });
        const r = await fetch(new URL("/.netlify/functions/analyse-background", req.url), {
          method: "POST",
          headers: { "x-admin-key": req.headers.get("x-admin-key") },
        });
        if (r.status !== 202) {
          await meta.setJSON("job", { state: "error", error: "Could not start analysis (" + r.status + ")", ts: Date.now() });
          return json({ error: "Could not start analysis" }, 500);
        }
        return json({ ok: true }, 202);
      }
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }
};
